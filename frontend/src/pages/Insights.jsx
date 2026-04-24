import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../store/useStore';

import FearBadge from '../components/fear/FearBadge';
import FearHistoryChart from '../components/fear/FearHistoryChart';
import MilestoneTracker from '../components/fear/MilestoneTracker';
import PortfolioRecommendations from '../components/fear/PortfolioRecommendationCard';

export default function Insights() {
  const user = useStore(s => s.user);
  const fearScore = useStore(s => s.fearScore);
  const orders = useStore(s => s.orders);
  const milestones = useStore(s => s.milestones);

  const tradingStats = useMemo(() => {
    const buyOrders = orders.filter(o => o.type === 'BUY');
    const sellOrders = orders.filter(o => o.type === 'SELL');
    const profitTrades = sellOrders.filter(o => (o.pnl || 0) > 0);
    const lossTrades = sellOrders.filter(o => (o.pnl || 0) < 0);
    const totalPnL = sellOrders.reduce((s, o) => s + (o.pnl || 0), 0);
    const sectorCounts = {};
    orders.forEach(o => {
      const stock = useStore.getState().stocks.find(s => s.symbol === o.symbol);
      if (stock) sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
    });

    return {
      totalTrades: orders.length,
      buyCount: buyOrders.length,
      sellCount: sellOrders.length,
      profitCount: profitTrades.length,
      lossCount: lossTrades.length,
      winRate: sellOrders.length > 0 ? ((profitTrades.length / sellOrders.length) * 100).toFixed(0) : '—',
      totalPnL: totalPnL.toFixed(2),
      sectorCounts,
    };
  }, [orders]);

  const sectorChartData = useMemo(() => {
    return Object.entries(tradingStats.sectorCounts).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [tradingStats]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Insights & Recommendations 📈</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your behavioral analytics and confidence journey</p>
      </motion.div>

      {/* Hero: Replace old SVGs with our new robust Badge */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <FearBadge score={user?.fearScore || 80} size="large" />
          
          <div style={{ flex: 1 }}>
             <FearHistoryChart />
          </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
         <MilestoneTracker />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '32px' }}>
         <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Recommended Portfolios</h2>
         <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Based on your current fear class, we recommend the following portfolio allocations.</p>
         <PortfolioRecommendations />
      </motion.div>

      <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Trading Stats */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Trading Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Total Trades', value: tradingStats.totalTrades, color: 'var(--text-primary)' },
              { label: 'Win Rate', value: `${tradingStats.winRate}%`, color: 'var(--green)' },
              { label: 'Buy Orders', value: tradingStats.buyCount, color: 'var(--green)' },
              { label: 'Sell Orders', value: tradingStats.sellCount, color: 'var(--red)' },
              { label: 'Profitable', value: tradingStats.profitCount, color: 'var(--green)' },
              { label: 'Loss-making', value: tradingStats.lossCount, color: 'var(--red)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sector Distribution */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Most Traded Sectors</h3>
          {sectorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 11, fill: '#a0a0b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Make some trades to see sector data</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
