import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../store/useStore';
import { getFearColor, getFearLabel } from '../engine/fearEngine';
import FearBadge from '../components/fear/FearBadge';

export default function Dashboard() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const holdings = useStore(s => s.holdings);
  const orders = useStore(s => s.orders);
  const fearScore = useStore(s => s.fearScore);
  const portfolioHistory = useStore(s => s.portfolioHistory);
  const milestones = useStore(s => s.milestones);
  const navigate = useNavigate();

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + (h.currentValue || 0), 0), [holdings]);
  const totalPnL = useMemo(() => holdings.reduce((s, h) => s + (h.pnl || 0), 0), [holdings]);
  const netWorth = (user?.iqCoins || 0) + totalValue;

  const topGainers = useMemo(() => [...stocks].sort((a, b) => b.dayChangePct - a.dayChangePct).slice(0, 5), [stocks]);
  const topLosers = useMemo(() => [...stocks].sort((a, b) => a.dayChangePct - b.dayChangePct).slice(0, 5), [stocks]);

  const fearColor = getFearColor(fearScore.score);
  const fearLabel = getFearLabel(fearScore.fearClass);

  const portfolioChartData = useMemo(() => {
    if (portfolioHistory.length < 2) {
      return Array.from({ length: 20 }, (_, i) => ({
        time: i, value: netWorth + (Math.random() - 0.45) * 200
      }));
    }
    return portfolioHistory.slice(-50).map((p, i) => ({ time: i, value: p.netWorth }));
  }, [portfolioHistory, netWorth]);

  const greeting = fearScore.fearClass === 'HIGH'
    ? "Let's explore safely—no real money involved."
    : fearScore.fearClass === 'LOW'
    ? "You're building real confidence. Ready for the next trade?"
    : "Welcome back! Keep learning, keep growing.";

  return (
    <div>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Welcome back, {user?.name || 'Investor'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{greeting}</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Net Worth', value: `₹${netWorth.toLocaleString()}`, change: totalPnL, icon: '💰' },
          { label: 'IQ Coins', value: `₹${(user?.iqCoins || 0).toLocaleString()}`, sub: 'Available', icon: '🪙' },
          { label: 'Portfolio Value', value: `₹${totalValue.toLocaleString()}`, change: totalPnL, icon: '📊' },
          { label: 'Total Trades', value: orders.length.toString(), sub: `${holdings.length} holdings`, icon: '📋' },
        ].map((stat, i) => (
          <motion.div key={i} className="stat-card"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
                {stat.change !== undefined && (
                  <div className="stat-card-change" style={{ color: stat.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {stat.change >= 0 ? '▲' : '▼'} ₹{Math.abs(stat.change).toLocaleString()}
                  </div>
                )}
                {stat.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.sub}</div>}
              </div>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Portfolio Chart */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Portfolio Performance</h3>
            <span className={`badge ${totalPnL >= 0 ? 'badge-green' : 'badge-red'}`}>
              {totalPnL >= 0 ? '▲' : '▼'} {Math.abs(totalPnL).toLocaleString()}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={portfolioChartData}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={totalPnL >= 0 ? '#10b981' : '#ef4444'}
                fill="url(#portGrad)" strokeWidth={2} dot={false} />
              <XAxis hide /><YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
                formatter={(v) => [`₹${v.toLocaleString()}`, 'Value']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Fear Score + Quick Actions */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '20px' }}>
            {/* Real Fear Badge */}
            <FearBadge score={fearScore.score} size="medium" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{fearLabel}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {fearScore.fearClass === 'HIGH' ? 'Take it slow. Each simulation builds confidence.' :
                 fearScore.fearClass === 'LOW' ? 'You\'re ready for diverse strategies!' :
                 'Growing steadily. Keep exploring different scenarios.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/explore')}>
              🔍 Explore Stocks
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/app/advisor')}>
              🤖 AI Advisor
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/app/holdings')}>
              💼 Holdings
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/app/insights')}>
              📈 Insights
            </button>
          </div>
        </motion.div>
      </div>

      {/* Market Movers */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🟢 Top Gainers
          </h3>
          {topGainers.map(stock => (
            <div key={stock.id}
              onClick={() => navigate(`/app/trade/${stock.symbol}`)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{stock.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{stock.symbol}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                  ▲ {stock.dayChangePct.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔴 Top Losers
          </h3>
          {topLosers.map(stock => (
            <div key={stock.id}
              onClick={() => navigate(`/app/trade/${stock.symbol}`)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{stock.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{stock.symbol}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)', fontWeight: 600 }}>
                  ▼ {Math.abs(stock.dayChangePct).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🏆 Achievements</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {milestones.map(m => (
              <div key={m.id} className="badge badge-purple" style={{ fontSize: '12px', padding: '6px 14px' }}>
                {m.label} — +{m.reward} IQ
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
