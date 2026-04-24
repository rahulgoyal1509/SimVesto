import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getMatchTypeLabel, getMatchTypeColor } from '../engine/counterpartyEngine';

function StatCard({ icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 8px', borderRadius: 10,
        background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
        flex: 1, minWidth: 0,
      }}
    >
      <span style={{ fontSize: 18, marginBottom: 4 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800,
        color: color || 'var(--text-primary)',
      }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, lineHeight: 1.3 }}>
        {label}
      </span>
    </motion.div>
  );
}

export default function MatchingImpactPanel({ matchedTrades }) {
  const stats = useMemo(() => {
    if (!matchedTrades || matchedTrades.length === 0) return null;

    const totalSaved = matchedTrades.reduce((s, t) => s + (t.totalSavings || 0), 0);
    const totalMatches = matchedTrades.length;
    const uniqueCounterparties = new Set(matchedTrades.map(t => t.counterparty?.name)).size;
    const avgImprovement = matchedTrades.reduce((s, t) => s + (t.priceImprovementPct || 0), 0) / totalMatches;
    const lastMatch = matchedTrades[0];

    return { totalSaved, totalMatches, uniqueCounterparties, avgImprovement, lastMatch };
  }, [matchedTrades]);

  if (!stats) return null;

  const { totalSaved, totalMatches, uniqueCounterparties, avgImprovement, lastMatch } = stats;
  const lastColor = getMatchTypeColor(lastMatch.matchType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: '18px', marginTop: 14 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          🤝
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Matching Impact</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs. paying market maker spread</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <StatCard icon="💰" label="Total Saved" value={`₹${totalSaved.toLocaleString()}`} color="#10b981" delay={0.05} />
        <StatCard icon="🤝" label="Matches" value={totalMatches} color="#8b5cf6" delay={0.1} />
        <StatCard icon="👥" label="Traders" value={uniqueCounterparties} color="#06b6d4" delay={0.15} />
      </div>

      {/* Avg price improvement */}
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
        marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Avg. price improvement</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#10b981' }}>
          +{avgImprovement.toFixed(3)}%
        </span>
      </div>

      {/* Last match */}
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Last Match
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{lastMatch.counterparty?.avatar}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastMatch.counterparty?.name}
            </div>
            <div style={{
              fontSize: 10, color: lastColor, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {getMatchTypeLabel(lastMatch.matchType)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
              +₹{(lastMatch.totalSavings || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {lastMatch.symbol} · {lastMatch.side}
            </div>
          </div>
        </div>
      </div>

      {/* Market maker cut-out note */}
      <div style={{
        marginTop: 10, padding: '8px 10px', borderRadius: 8,
        fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
        borderLeft: '2px solid var(--border-strong)',
        paddingLeft: 10,
      }}>
        Market maker would have taken <strong style={{ color: '#ef4444' }}>₹{totalSaved.toLocaleString()}</strong> as spread.<br />
        <strong style={{ color: '#10b981' }}>You kept it.</strong>
      </div>
    </motion.div>
  );
}
