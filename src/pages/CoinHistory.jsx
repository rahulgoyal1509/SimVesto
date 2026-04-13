import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'REWARD', label: 'Achievements' },
  { value: 'TRADE', label: 'Trades' },
  { value: 'SYSTEM', label: 'System' },
];

const formatAmount = (amount) => {
  if (Number.isNaN(amount) || amount === undefined) return '₹0';
  return `${amount >= 0 ? '+' : '-'}₹${Math.abs(amount).toLocaleString()}`;
};

const eventColor = (event) => {
  if (event.type === 'REWARD') return 'var(--green)';
  if (event.type === 'TRADE') return event.amount >= 0 ? 'var(--green)' : 'var(--red)';
  return 'var(--accent-purple)';
};

export default function CoinHistory() {
  const coinHistory = useStore((s) => s.coinHistory);
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return coinHistory;
    return coinHistory.filter((event) => event.type === filter);
  }, [coinHistory, filter]);

  const totals = useMemo(() => {
    const totalRewards = coinHistory
      .filter((event) => event.type === 'REWARD')
      .reduce((sum, event) => sum + (event.amount || 0), 0);
    const totalTradeGain = coinHistory
      .filter((event) => event.type === 'TRADE' && event.amount > 0)
      .reduce((sum, event) => sum + event.amount, 0);
    const totalTradeSpend = coinHistory
      .filter((event) => event.type === 'TRADE' && event.amount < 0)
      .reduce((sum, event) => sum + event.amount, 0);
    return {
      totalRewards,
      totalTradeGain,
      totalTradeSpend,
    };
  }, [coinHistory]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Coin History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Track every coin movement so you can verify the source of milestone rewards, sale proceeds, and your starting balance.
        </p>
      </motion.div>

      <div className="coin-history-summary">
        <div className="coin-history-chip">
          <span>Total events</span>
          <strong>{coinHistory.length}</strong>
        </div>
        <div className="coin-history-chip">
          <span>Reward coins</span>
          <strong style={{ color: totals.totalRewards > 0 ? 'var(--green)' : 'var(--text-primary)' }}>
            +₹{totals.totalRewards.toLocaleString()}
          </strong>
        </div>
        <div className="coin-history-chip">
          <span>Trade earnings</span>
          <strong style={{ color: totals.totalTradeGain > 0 ? 'var(--green)' : 'var(--text-primary)' }}>
            +₹{totals.totalTradeGain.toLocaleString()}
          </strong>
        </div>
        <div className="coin-history-chip">
          <span>Trade spend</span>
          <strong style={{ color: totals.totalTradeSpend < 0 ? 'var(--red)' : 'var(--text-primary)' }}>
            ₹{totals.totalTradeSpend.toLocaleString()}
          </strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            className={`btn btn-sm ${filter === item.value ? '' : 'btn-ghost'}`}
            onClick={() => setFilter(item.value)}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🪙</div>
          <h3>No coin history events yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Your earned coins and trade flows will show here as you trade and unlock achievements.
          </p>
        </motion.div>
      ) : (
        <motion.div className="coin-history-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {filtered.map((event) => (
            <div key={event.id} className="coin-history-card">
              <div className="coin-history-meta">
                <span className="badge badge-purple" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-purple)' }}>
                  {event.type}
                </span>
                <span className="coin-history-date">
                  {new Date(event.timestamp).toLocaleDateString()} · {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{event.label}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>{event.note || event.source}</p>
              <div className="coin-history-stats">
                <span className={`coin-history-amount ${event.amount >= 0 ? 'positive' : 'negative'}`} style={{ color: eventColor(event) }}>
                  {formatAmount(event.amount)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Balance after: ₹{Number(event.balanceAfter || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
