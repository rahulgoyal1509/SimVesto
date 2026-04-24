import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestionColor, getSuggestionEmoji } from '../engine/monteCarlo';

// ── Mood config ───────────────────────────────────────────────────────────────
const MOODS = [
  { id: 'confident', sym: '◆', label: 'Confident', sub: 'Built different', color: '#10b981', fearDelta: -5 },
  { id: 'calm', sym: '◈', label: 'Calm', sub: 'Zen mode on', color: '#06b6d4', fearDelta: -3 },
  { id: 'neutral', sym: '◇', label: 'Neutral', sub: 'Idk tbh', color: '#9ca3af', fearDelta: 0 },
  { id: 'anxious', sym: '◉', label: 'Anxious', sub: 'Lowkey shaking', color: '#f97316', fearDelta: +3 },
  { id: 'panicked', sym: '✕', label: 'Panicked', sub: 'It\'s joever', color: '#ef4444', fearDelta: +5 },
];

// Notes sentiment (simple keyword scan)
const POS = ['confident', 'bull', 'growth', 'opportunity', 'strong', 'potential', 'accumulate', 'long', 'solid'];
const NEG = ['worried', 'risk', 'uncertain', 'volatile', 'scared', 'fear', 'drop', 'bearish', 'loss'];
function sentimentDelta(text) {
  if (!text || text.length < 8) return 0;
  const l = text.toLowerCase();
  const p = POS.filter(w => l.includes(w)).length;
  const n = NEG.filter(w => l.includes(w)).length;
  return p > n ? -1 : n > p ? +1 : 0;
}

// ── Risk Gauge SVG ────────────────────────────────────────────────────────────
function RiskGauge({ pct }) {
  const angle = -130 + (Math.min(100, Math.max(0, pct)) / 100) * 260;
  const color = pct < 30 ? '#10b981' : pct < 55 ? '#f59e0b' : '#ef4444';
  const rad = ((angle - 90) * Math.PI) / 180;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 74" width="140" height="84" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
        <path d="M 15 68 A 45 45 0 1 1 105 68" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 15 68 A 45 45 0 1 1 105 68" fill="none" stroke="url(#rg)" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" /><stop offset="55%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" />
        </linearGradient></defs>
        <motion.line x1="60" y1="68"
          initial={{ x2: 60, y2: 24 }}
          animate={{ x2: 60 + 40 * Math.cos(rad), y2: 68 + 40 * Math.sin(rad) }}
          transition={{ duration: 1.4, type: 'spring', stiffness: 60 }}
          stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="68" r="5" fill={color} />
        <text x="60" y="56" textAnchor="middle" fill={color} fontSize="12" fontWeight="800">{pct}%</text>
        <text x="60" y="66" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7">LOSS RISK</text>
      </svg>
    </div>
  );
}

// ── 3D Outcome Card ───────────────────────────────────────────────────────────
function Card3D({ label, value, color, sym, delay, retPct }) {
  const [h, setH] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 180 }}
      onHoverStart={() => setH(true)} onHoverEnd={() => setH(false)}>
      <motion.div animate={{ rotateY: h ? 6 : 0, scale: h ? 1.05 : 1 }} transition={{ duration: 0.22 }}
        style={{
          background: `linear-gradient(140deg, ${color}14, ${color}06)`,
          border: `1.5px solid ${color}35`,
          borderRadius: 14, padding: '16px 12px', textAlign: 'center',
          boxShadow: h ? `0 16px 40px ${color}22` : `0 4px 16px ${color}10`,
          position: 'relative', overflow: 'hidden', cursor: 'default',
        }}>
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: `linear-gradient(90deg, transparent, ${color}70, transparent)`
        }} />
        <div style={{
          fontSize: 11, color, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: 8
        }}>{sym} {label}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 900, color,
          lineHeight: 1.1, marginBottom: 4
        }}>₹{Number(value).toLocaleString()}</div>
        {retPct !== undefined && (
          <div style={{ fontSize: 12, fontWeight: 700, color, opacity: 0.75 }}>
            {retPct >= 0 ? '+' : ''}{retPct.toFixed(1)}%
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TradeAnalysisPanel({
  stock, mcResult, mcLoading, aiText, aiLoading,
  onRunAnalysis, onMoodSubmit, previousNotes,
}) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [impact, setImpact] = useState(null);

  const handleSubmit = () => {
    if (!mood) return;
    const m = MOODS.find(x => x.id === mood);
    const sd = sentimentDelta(note);
    const total = m.fearDelta + sd;
    setImpact({ delta: total, mood: m });
    setDone(true);
    onMoodSubmit({
      mood: m.id, moodEmoji: m.sym, moodLabel: m.label,
      fearDelta: total, note: note.trim(), timestamp: Date.now()
    });
  };

  const inv = stock?.currentPrice || 0;
  const memeHeaders = ['No cap, here\'s the tea ☕', 'fr fr the AI cooked 🔥', 'Not financial advice bestie'];
  const memeHdr = memeHeaders[Math.floor(Math.random() * memeHeaders.length)];

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      background: 'linear-gradient(160deg, var(--bg-surface) 0%, rgba(124,58,237,0.05) 100%)',
      border: '1.5px solid var(--border-strong)',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '18px 22px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(90deg, rgba(124,58,237,0.1), transparent)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 16px rgba(139,92,246,0.45)',
          }}>◈</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>AI Trade Advisor</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              Monte Carlo · 1,000 scenarios · {stock?.name}
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => { setDone(false); setMood(null); setNote(''); setImpact(null); onRunAnalysis(); }}
          disabled={mcLoading}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
            background: mcLoading ? 'var(--bg-surface-2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none', color: mcLoading ? 'var(--text-muted)' : 'white',
            cursor: mcLoading ? 'not-allowed' : 'pointer',
            boxShadow: mcLoading ? 'none' : '0 4px 18px rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          {mcLoading
            ? <><span style={{
              width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
              animation: 'spin 0.8s linear infinite'
            }} /> Cooking…</>
            : <>{mcResult ? '↺ Re-Analyse' : '▶ Analyse Trade'}</>}
        </motion.button>
      </div>

      <div style={{ padding: '22px' }}>
        <AnimatePresence mode="wait">

          {/* Empty state */}
          {!mcResult && !mcLoading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 14, filter: 'grayscale(1)', opacity: 0.4 }}>◈</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
                Run the analysis, bestie
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
                1,000 Monte Carlo paths for <strong>{stock?.name}</strong><br />
                <span style={{ opacity: 0.6 }}>Not financial advice. Do your own research. Etc etc.</span>
              </p>
            </motion.div>
          )}

          {/* Results */}
          {mcResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Suggestion + Gauge — tight 2-col grid, no gaps */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
                alignItems: 'center', marginBottom: 20
              }}>
                {/* Left: badge + sub-info */}
                <div>
                  <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', borderRadius: 14,
                      background: `${getSuggestionColor(mcResult.suggestion)}14`,
                      border: `2px solid ${getSuggestionColor(mcResult.suggestion)}40`,
                      boxShadow: `0 0 28px ${getSuggestionColor(mcResult.suggestion)}18`,
                      marginBottom: 10,
                    }}>
                    <span style={{ fontSize: 24 }}>{getSuggestionEmoji(mcResult.suggestion)}</span>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 900,
                        color: getSuggestionColor(mcResult.suggestion), letterSpacing: '-0.02em'
                      }}>
                        {mcResult.suggestion}
                      </div>
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2
                      }}>
                        {{
                          'STRONG BUY': 'High upside, low loss risk — sims strongly favour entry',
                          'BUY': 'More sims ended profitable — decent risk-reward here',
                          'AVERAGE': 'Mixed signals — roughly equal bullish & bearish paths',
                          'HOLD': 'No strong edge either way — current position looks fine',
                          'SELL': 'More sims ended in loss — consider exiting or sizing down',
                          'STRONG SELL': 'High loss probability — most paths point downward',
                        }[mcResult.suggestion] ?? 'AI VERDICT · ' + memeHdr}
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick stats strip under badge */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Price', value: `₹${stock?.currentPrice?.toLocaleString()}` },
                      {
                        label: 'Today', value: `${(stock?.dayChangePct ?? 0) >= 0 ? '+' : ''}${(stock?.dayChangePct ?? 0).toFixed(2)}%`,
                        color: (stock?.dayChangePct ?? 0) >= 0 ? '#10b981' : '#ef4444'
                      },
                      { label: 'Sector', value: stock?.sector },
                      { label: 'Horizon', value: '3 months' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: '4px 10px', borderRadius: 8,
                        background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                        fontSize: 11, display: 'flex', gap: 5, alignItems: 'center',
                      }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 800,
                          color: s.color || 'var(--text-primary)'
                        }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: gauge — compact */}
                <RiskGauge pct={mcResult.lossProbability} />
              </div>

              {/* 3D Outcome cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                <Card3D label="Best Case" sym="▲" color="#10b981" value={mcResult.bestCase} delay={0.05}
                  retPct={inv > 0 ? (mcResult.bestCase - inv) / inv * 100 : undefined} />
                <Card3D label="Expected" sym="◆" color="#8b5cf6" value={mcResult.expectedCase} delay={0.12}
                  retPct={inv > 0 ? (mcResult.expectedCase - inv) / inv * 100 : undefined} />
                <Card3D label="Worst Case" sym="▼" color="#ef4444" value={mcResult.worstCase} delay={0.2}
                  retPct={inv > 0 ? (mcResult.worstCase - inv) / inv * 100 : undefined} />
              </div>

              {/* Metrics strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0,
                marginBottom: 20, borderRadius: 12,
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}>
                {[
                  { label: 'VOLATILITY', value: `${(stock?.volatility * 100).toFixed(1)}%`, note: 'price swings' },
                  { label: 'ANNUAL DRIFT', value: `${(stock?.drift * 100).toFixed(1)}%`, note: 'avg growth' },
                  { label: 'LOSS PROB.', value: `${mcResult.lossProbability}%`, note: 'bear scenario' },
                  { label: 'SECTOR', value: stock?.sector, note: 'industry' },
                ].map((m, i) => (
                  <div key={i} style={{
                    padding: '12px 8px', textAlign: 'center',
                    borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 900,
                      marginBottom: 3, letterSpacing: '-0.01em'
                    }}>{m.value}</div>
                    <div style={{
                      fontSize: 9, color: 'var(--text-muted)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em'
                    }}>{m.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>{m.note}</div>
                  </div>
                ))}
              </div>

              {/* AI Narration */}
              {(aiText || aiLoading) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: 22, padding: '18px 20px', borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.06))',
                    borderLeft: '3px solid #7c3aed', position: 'relative', overflow: 'hidden',
                  }}>
                  <div style={{
                    position: 'absolute', top: -24, right: -24, width: 90, height: 90,
                    borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(24px)'
                  }} />
                  <div style={{
                    fontSize: 10, fontWeight: 900, color: '#a78bfa',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10
                  }}>
                    ✦ AI understands the assignment
                  </div>
                  <div style={{
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.85,
                    fontWeight: 500, position: 'relative'
                  }}>
                    {aiText}
                    {aiLoading && (
                      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                        style={{
                          display: 'inline-block', width: 2, height: 15, background: '#a78bfa',
                          marginLeft: 3, verticalAlign: 'middle'
                        }} />
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Mood + Notes section ── */}
              <AnimatePresence mode="wait">
                {!done ? (
                  <motion.div key="form"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{
                      padding: '20px', borderRadius: 16,
                      background: 'var(--bg-surface-2)',
                      border: '1.5px solid var(--border-subtle)',
                    }}>
                    {/* Question */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>
                        POV: how do you feel about{' '}
                        <span style={{ color: 'var(--accent-purple-light)' }}>{stock?.name}</span>?
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Be real — your answer calibrates your Fear Score. No cap.
                      </div>
                    </div>

                    {/* Mood pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                      {MOODS.map(m => {
                        const sel = mood === m.id;
                        return (
                          <motion.button key={m.id}
                            whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setMood(m.id)}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                              padding: '12px 16px', borderRadius: 12, cursor: 'pointer', flex: '1 1 80px',
                              background: sel ? `${m.color}18` : 'var(--bg-surface)',
                              border: `2px solid ${sel ? m.color : 'var(--border-subtle)'}`,
                              boxShadow: sel ? `0 0 20px ${m.color}28` : 'none',
                              transition: 'all 0.18s',
                            }}>
                            <span style={{
                              fontSize: 20, color: sel ? m.color : 'var(--text-muted)',
                              fontWeight: 900, lineHeight: 1,
                            }}>{m.sym}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 800,
                              color: sel ? m.color : 'var(--text-secondary)',
                              textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>{m.label}</span>
                            <span style={{
                              fontSize: 9, color: sel ? m.color : 'var(--text-muted)',
                              opacity: sel ? 0.9 : 0.6, fontStyle: 'italic'
                            }}>{m.sub}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{
                        fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7
                      }}>
                        ◈ Drop your thoughts <span style={{
                          fontWeight: 500, textTransform: 'none',
                          letterSpacing: 0, opacity: 0.6
                        }}>— saved for you, private</span>
                      </label>
                      <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={3}
                        placeholder={`What's your read on ${stock?.name}? FOMO? Conviction? Bag holding trauma? All valid here.`}
                        style={{
                          width: '100%', padding: '11px 13px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                          background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)',
                          color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                          lineHeight: 1.65, fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#7c3aed'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; }} />
                      <div style={{
                        textAlign: 'right', fontSize: 10, color: 'var(--text-muted)',
                        marginTop: 3, opacity: 0.6
                      }}>{note.length}/500</div>
                    </div>

                    {/* Submit */}
                    <motion.button whileHover={{ scale: mood ? 1.02 : 1 }} whileTap={{ scale: mood ? 0.97 : 1 }}
                      onClick={handleSubmit} disabled={!mood}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 900,
                        letterSpacing: '-0.01em', cursor: mood ? 'pointer' : 'not-allowed',
                        background: mood
                          ? `linear-gradient(135deg, ${MOODS.find(x => x.id === mood)?.color}, #7c3aed)`
                          : 'var(--bg-surface)',
                        border: mood ? 'none' : '1.5px solid var(--border-default)',
                        color: mood ? 'white' : 'var(--text-muted)',
                        boxShadow: mood ? `0 6px 24px ${MOODS.find(x => x.id === mood)?.color}40` : 'none',
                        transition: 'all 0.2s',
                      }}>
                      {mood
                        ? `${MOODS.find(x => x.id === mood)?.sym} Submit · ${MOODS.find(x => x.id === mood)?.label} — See your Fear Score`
                        : 'Pick a mood to unlock your Fear Score'}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="done"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      padding: '18px 20px', borderRadius: 14,
                      background: impact?.delta <= 0 ? 'rgba(16,185,129,0.09)' : 'rgba(239,68,68,0.07)',
                      border: `1.5px solid ${impact?.delta <= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 32, color: impact?.mood.color, fontWeight: 900 }}>
                        {impact?.mood.sym}
                      </span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3 }}>
                          Understood the assignment —{' '}
                          <span style={{ color: impact?.mood.color }}>{impact?.mood.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          Fear Score adjusted{' '}
                          <strong style={{ color: impact?.delta <= 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>
                            {impact?.delta > 0 ? '+' : ''}{impact?.delta} pts
                          </strong>
                          {note.trim() && <> · Note saved ✓</>}
                          {' '}· Fear Score popup incoming 🫡
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Past notes */}
              {previousNotes?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{ marginTop: 18 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10
                  }}>
                    ◈ Your past notes on {stock?.name}
                  </div>
                  {previousNotes.slice(0, 3).map((n, i) => (
                    <div key={i} style={{
                      padding: '11px 14px', borderRadius: 10, marginBottom: 8,
                      background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: n.note ? 5 : 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>
                          {n.moodEmoji} {n.moodLabel}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(n.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {n.note && (
                        <div style={{
                          fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                          fontStyle: 'italic', opacity: 0.85
                        }}>"{n.note}"</div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
