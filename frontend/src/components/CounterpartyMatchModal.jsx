import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMatchTypeLabel, getMatchTypeColor } from '../engine/counterpartyEngine';

// Fear-score colour helper
function fearColor(score) {
  if (score >= 70) return '#ef4444';
  if (score >= 45) return '#f97316';
  return '#10b981';
}
function fearLabel(score) {
  if (score >= 75) return 'PANICKING';
  if (score >= 55) return 'ANXIOUS';
  if (score >= 35) return 'NEUTRAL';
  return 'CONFIDENT';
}

// ── Scanning animation ────────────────────────────────────────────────────────
function ScanningPhase({ side }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ textAlign: 'center', padding: '40px 20px' }}
    >
      {/* Pulsing radar */}
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 28px' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `2px solid ${side === 'BUY' ? '#10b981' : '#8b5cf6'}`,
            }}
            animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
          />
        ))}
        <div style={{
          position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)',
          width: 56, height: 56, borderRadius: '50%',
          background: side === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
          border: `2px solid ${side === 'BUY' ? '#10b981' : '#8b5cf6'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {side === 'BUY' ? '🧠' : '💎'}
        </div>
      </div>

      <motion.h3
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
      >
        Scanning for Counterparty…
      </motion.h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
        Searching for a trader with <strong>opposite behavior</strong>
        <br />to match your {side === 'BUY' ? 'buy' : 'sell'} order
      </p>

      {/* Animated user dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
        {['😰', '🧠', '😨', '📊', '😟', '🎯'].map((emoji, i) => (
          <motion.span
            key={i}
            style={{ fontSize: 20, filter: 'grayscale(0.6)' }}
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Match result card ─────────────────────────────────────────────────────────
function MatchResult({ match, stock, quantity, userFearScore, onAccept, onSkip }) {
  const { counterparty, matchType, matchedPrice, priceImprovementPct, savingsPerShare, insight, side } = match;
  const totalSavings = parseFloat((savingsPerShare * quantity).toFixed(2));
  const marketPrice  = side === 'BUY' ? stock.buyPrice : stock.sellPrice;
  const matchColor   = getMatchTypeColor(matchType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
            background: `${matchColor}22`, border: `2px solid ${matchColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}
        >
          {counterparty.avatar}
        </motion.div>
        <div style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: 99,
          background: `${matchColor}18`, border: `1px solid ${matchColor}44`,
          color: matchColor, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
          marginBottom: 8,
        }}>
          {getMatchTypeLabel(matchType)}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
          {counterparty.name}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {counterparty.archetype} · "{counterparty.tagline}"
        </p>
      </div>

      {/* Fear Score Comparison */}
      <div style={{
        background: 'var(--bg-surface-2)', borderRadius: 12,
        padding: '12px 14px', marginBottom: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Fear Score Contrast
        </div>
        {/* User */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>You</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: fearColor(userFearScore), fontWeight: 700 }}>
              {userFearScore} — {fearLabel(userFearScore)}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${userFearScore}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ height: '100%', background: fearColor(userFearScore), borderRadius: 99 }}
            />
          </div>
        </div>
        {/* Counterparty */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{counterparty.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: fearColor(counterparty.fearScore), fontWeight: 700 }}>
              {counterparty.fearScore} — {fearLabel(counterparty.fearScore)}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${counterparty.fearScore}%` }}
              transition={{ duration: 0.8, delay: 0.35 }}
              style={{ height: '100%', background: fearColor(counterparty.fearScore), borderRadius: 99 }}
            />
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div style={{
        background: 'var(--bg-surface-2)', borderRadius: 12,
        padding: '12px 14px', marginBottom: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Price Comparison
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Market price */}
          <div style={{
            textAlign: 'center', padding: '12px', borderRadius: 10,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
              {side === 'BUY' ? 'Market Ask' : 'Market Bid'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
              ₹{marketPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Spread included</div>
          </div>
          {/* Matched price */}
          <div style={{
            textAlign: 'center', padding: '12px', borderRadius: 10,
            background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.3)',
          }}>
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
              Matched Price ✓
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#10b981' }}>
              ₹{matchedPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>
              {priceImprovementPct}% better
            </div>
          </div>
        </div>
        {/* Savings banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
            💰 You save on {quantity} share{quantity > 1 ? 's' : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#10b981' }}>
            +₹{totalSavings.toLocaleString()}
          </span>
        </motion.div>
      </div>

      {/* Behavioral Insight */}
      <div style={{
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--bg-surface-2)', borderLeft: `3px solid ${matchColor}`,
        marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        "{insight}"
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onSkip}
          style={{
            flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          Skip — Use Market Price
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onAccept(matchedPrice)}
          style={{
            flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
          }}
        >
          ✅ Accept Match — Save ₹{totalSavings.toLocaleString()}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CounterpartyMatchModal({
  isOpen, match, stock, quantity, userFearScore, onAccept, onSkip, onClose,
}) {
  const [phase, setPhase] = useState('scanning'); // 'scanning' | 'result'

  useEffect(() => {
    if (!isOpen) { setPhase('scanning'); return; }
    const t = setTimeout(() => setPhase('result'), 1600);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 20,
              padding: '22px 20px 20px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              position: 'relative',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border-default) transparent',
            }}
          >
            {/* Title bar — sticky so ✕ always visible */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20,
              position: 'sticky', top: 0, zIndex: 10,
              background: 'var(--bg-surface)',
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
              marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤝</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Behavioral Counterparty Matching</span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, color: 'var(--text-muted)', lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <AnimatePresence mode="wait">
              {phase === 'scanning' ? (
                <ScanningPhase key="scan" side={match?.side || 'BUY'} />
              ) : (
                match && (
                  <MatchResult
                    key="result"
                    match={match}
                    stock={stock}
                    quantity={quantity}
                    userFearScore={userFearScore}
                    onAccept={onAccept}
                    onSkip={onSkip}
                  />
                )
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
