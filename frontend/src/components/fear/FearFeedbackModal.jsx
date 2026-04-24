import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';


// ── helpers ───────────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 65) return '#ef4444';
  if (s >= 35) return '#f59e0b';
  return '#10b981';
}
function scoreLabel(s) {
  if (s >= 65) return 'HIGH FEAR · Emotions running hot';
  if (s >= 35) return 'MEDIUM FEAR · Some hesitation';
  return 'LOW FEAR · Calm & rational';
}
function deltaInfo(d, score) {
  const cls = score >= 65 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
  if (d < 0) return {
    label: 'Fear is dropping — slay! 💪',
    msg: `Your fear went down. Lower fear = better decisions, less panic selling, and stronger conviction in trades. You\'re literally built different.`,
    color: '#10b981',
  };
  if (d > 0) return {
    label: 'Fear went up a bit',
    msg: `Slight spike detected. High fear (65+) causes panic selling & FOMO buys. Try running the AI analysis before your next trade to stay composed 🫂`,
    color: '#f59e0b',
  };
  return {
    label: 'Steady state — no change',
    msg: `You\'re currently in ${cls} FEAR territory. Your Fear Score directly affects counterparty matching and AI recommendations across SimVesto. Aim low 🔍`,
    color: '#10b981',
  };
}

// ── Confetti (fear drop) ──────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#10b981', '#a855f7', '#06b6d4', '#f59e0b', '#ffffff', '#34d399'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10002, overflow: 'hidden' }}>
      {/* Flash overlay */}
      <motion.div
        initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }}
        style={{ position: 'absolute', inset: 0, background: '#10b981', zIndex: 1 }}
      />
      {/* Confetti particles */}
      {[...Array(55)].map((_, i) => (
        <motion.div key={i}
          initial={{ y: -30, x: Math.random() * window.innerWidth, rotate: 0, opacity: 1, scale: Math.random() * 0.7 + 0.6 }}
          animate={{ y: window.innerHeight + 60, rotate: Math.random() * 720 - 360, opacity: 0 }}
          transition={{ duration: 1.6 + Math.random() * 1.8, ease: 'easeOut', delay: Math.random() * 0.3 }}
          style={{
            position: 'absolute', width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 10 : 7,
            borderRadius: i % 2 === 0 ? '50%' : 2,
            background: colors[i % colors.length],
          }}
        />
      ))}
    </div>
  );
}

// ── Rain (fear increase) ──────────────────────────────────────────────────────
function Rain() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10002, overflow: 'hidden' }}>
      {/* Flash overlay — red */}
      <motion.div
        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }}
        style={{ position: 'absolute', inset: 0, background: '#ef4444', zIndex: 1 }}
      />
      {/* Rain drops */}
      {[...Array(45)].map((_, i) => (
        <motion.div key={i}
          initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 0.6 }}
          animate={{ y: window.innerHeight + 30, opacity: 0 }}
          transition={{
            duration: 0.9 + Math.random() * 1.4, ease: 'linear',
            delay: Math.random() * 3, repeat: 1
          }}
          style={{
            position: 'absolute', width: 1.5, height: 18 + Math.random() * 20,
            background: 'linear-gradient(180deg, transparent, #ef444480)',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ── Score arc ─────────────────────────────────────────────────────────────────
function ScoreArc({ score }) {
  const color = scoreColor(score);
  const pct = score / 100;
  const angle = -130 + pct * 260;
  const rad = ((angle - 90) * Math.PI) / 180;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 78" width="130" height="88"
        style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 15 72 A 45 45 0 1 1 105 72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" strokeLinecap="round" />
        <path d="M 15 72 A 45 45 0 1 1 105 72" fill="none" stroke="url(#arcG)" strokeWidth="9" strokeLinecap="round" opacity="0.4" />
        <motion.line x1="60" y1="72"
          initial={{ x2: 60, y2: 30 }}
          animate={{ x2: 60 + 38 * Math.cos(rad), y2: 72 + 38 * Math.sin(rad) }}
          transition={{ duration: 1.3, type: 'spring', stiffness: 55 }}
          stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="60" cy="72" r="5" fill={color} />
      </svg>
      <motion.div
        initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 220 }}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 900,
          color, lineHeight: 1, letterSpacing: '-0.04em', marginTop: -6
        }}>
        {score}
      </motion.div>
      <div style={{
        fontSize: 10, fontWeight: 900, color, textTransform: 'uppercase',
        letterSpacing: '0.12em', marginTop: 5, opacity: 0.9
      }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function FearFeedbackModal({ isOpen, onClose, logData }) {
  const fearScore = useStore(s => s.fearScore);
  if (!isOpen || !logData) return null;

  const delta = logData.delta ?? 0;
  const prev = logData.previousScore ?? (logData.score - delta);
  const curr = logData.score ?? fearScore?.score ?? 50;
  const info = deltaInfo(delta, curr);
  const improved = delta < 0;
  const worsened = delta > 0;
  // Always green card border — clean look
  const cardBorder = '#10b98140';
  const cardGlow = '#10b98112';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Particle effects */}
          {improved && <Confetti />}
          {worsened && <Rain />}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            {/* Modal card — wide square */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 580,
                background: 'var(--bg-surface)',
                border: `2px solid ${cardBorder}`,
                borderRadius: 22, overflow: 'hidden',
                boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 60px ${cardGlow}`,
                position: 'relative', zIndex: 10001,
              }}
            >
              {/* Top accent bar */}
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{
                  height: 4, background: `linear-gradient(90deg, ${info.color}, #7c3aed, transparent)`,
                  transformOrigin: 'left'
                }}
              />

              {/* Header */}
              <div style={{
                padding: '18px 24px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                background: `linear-gradient(90deg, ${info.color}10, transparent)`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>
                    Fear Score Update
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                    Mood report processed · Score synced across SimVesto
                  </div>
                </div>
                <button onClick={onClose} style={{
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>

              {/* Body — 2-col layout */}
              <div style={{
                padding: '20px 24px', display: 'grid',
                gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center'
              }}>

                {/* Left: arc + score */}
                <div>
                  <ScoreArc score={curr} />
                </div>

                {/* Right: before→after + message */}
                <div>
                  {/* Before → After */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        fontSize: 9, fontWeight: 800, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5
                      }}>Before</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900,
                        color: scoreColor(prev), lineHeight: 1
                      }}>{prev}</div>
                      <div style={{
                        fontSize: 8, color: scoreColor(prev), fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3
                      }}>{scoreLabel(prev)}</div>
                    </div>

                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.45, type: 'spring', stiffness: 320 }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 900, color: info.color, padding: '5px 10px',
                        borderRadius: 99, background: `${info.color}18`,
                        border: `1.5px solid ${info.color}45`, fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                      }}>
                        {delta > 0 ? '+' : ''}{delta} pts
                      </div>
                      <span style={{ fontSize: 18, color: info.color, opacity: 0.6 }}>→</span>
                    </motion.div>

                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        fontSize: 9, fontWeight: 800, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5
                      }}>Now</div>
                      <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.38 }}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900,
                          color: scoreColor(curr), lineHeight: 1
                        }}>{curr}</motion.div>
                      <div style={{
                        fontSize: 8, color: scoreColor(curr), fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3
                      }}>{scoreLabel(curr)}</div>
                    </div>
                  </div>

                  {/* Message */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      padding: '12px 14px', borderRadius: 10, marginBottom: 14,
                      background: `${info.color}10`, border: `1.5px solid ${info.color}30`,
                    }}>
                    <div style={{
                      fontSize: 14, fontWeight: 900, color: info.color,
                      marginBottom: 3, letterSpacing: '-0.01em'
                    }}>{info.label}</div>
                    <div style={{
                      fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                      fontWeight: 500
                    }}>{info.msg}</div>
                  </motion.div>

                  {/* Footer note */}
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65,
                    fontWeight: 500, padding: '10px 12px', borderRadius: 8,
                    background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                  }}>
                    Affects <strong style={{ color: 'var(--text-primary)' }}>counterparty matching</strong>,{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>recommendations</strong> &amp;{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>behavioral profile</strong> sitewide.
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={{ padding: '0 24px 20px' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12,
                    fontSize: 14, fontWeight: 900, letterSpacing: '-0.01em',
                    background: `linear-gradient(135deg, ${info.color}, #7c3aed)`,
                    border: 'none', color: 'white', cursor: 'pointer',
                    boxShadow: `0 6px 24px ${info.color}35`,
                  }}>
                  {improved ? "🚀 Let's cook — keep trading smart"
                    : worsened ? '💪 Got it — staying composed'
                      : '◈ Noted — back to the charts'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
