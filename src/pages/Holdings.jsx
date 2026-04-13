import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useStore from '../store/useStore';
import { generateNarration } from '../engine/aiNarrator';

const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

export default function Holdings() {
  const holdings = useStore(s => s.holdings);
  const stocks = useStore(s => s.stocks);
  const user = useStore(s => s.user);
  const orders = useStore(s => s.orders);
  const fearScore = useStore(s => s.fearScore);
  const geminiApiKey = useStore(s => s.geminiApiKey);
  const navigate = useNavigate();
  const [aiText, setAiText] = useState('');

  const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');
  const [aiLoading, setAiLoading] = useState(false);

  const enrichedHoldings = useMemo(() => {
    return holdings.map(h => {
      const stock = stocks.find(s => s.id === h.stockId);
      const currentValue = stock ? h.quantity * stock.currentPrice : h.currentValue || 0;
      const investedValue = h.quantity * h.avgBuyPrice;
      return {
        ...h,
        currentPrice: stock?.currentPrice || h.currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        investedValue: parseFloat(investedValue.toFixed(2)),
        pnl: parseFloat((currentValue - investedValue).toFixed(2)),
        pnlPct: parseFloat(((currentValue - investedValue) / investedValue * 100).toFixed(2)),
        color: stock?.color || '#7c3aed',
      };
    });
  }, [holdings, stocks]);

  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.investedValue, 0);
  const totalCurrent = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100) : 0;

  const pieData = enrichedHoldings.map((h, i) => ({
    name: formatSymbol(h.symbol), value: h.currentValue, color: COLORS[i % COLORS.length],
  }));

  const analyzePortfolio = async () => {
    setAiLoading(true);
    setAiText('');
    await generateNarration({
      apiKey: geminiApiKey,
      context: {
        type: 'portfolio_analysis',
        fearScore: fearScore.score,
        fearClass: fearScore.fearClass,
        literacyScore: user?.literacyScore || 5,
        portfolio: enrichedHoldings.map(h => ({ symbol: h.symbol, qty: h.quantity, pnl: h.pnl, value: h.currentValue })),
        tradeHistory: orders.slice(0, 10),
        currentPnL: totalPnL.toFixed(2),
      },
      onToken: (text) => setAiText(text),
    });
    setAiLoading(false);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Holdings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your current portfolio and positions</p>
      </motion.div>

      {holdings.length === 0 ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
          <h3 style={{ marginBottom: '8px' }}>No holdings yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Start trading to build your portfolio</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/explore')}>Explore Stocks</button>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            {[
              { label: 'Current Value', value: `₹${totalCurrent.toLocaleString()}`, color: 'var(--text-primary)' },
              { label: 'Total Invested', value: `₹${totalInvested.toLocaleString()}`, color: 'var(--text-secondary)' },
              { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(2)} (${totalPnLPct.toFixed(2)}%)`, color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map((s, i) => (
              <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
            {/* Pie Chart */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Allocation</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                {pieData.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color }} />
                    {p.name}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Portfolio Analysis */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>🤖 AI Portfolio Analysis</h3>
                <button className="btn btn-primary btn-sm" onClick={analyzePortfolio} disabled={aiLoading}>
                  {aiLoading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Analyze'}
                </button>
              </div>
              {aiText ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, borderLeft: '3px solid var(--accent-purple)', paddingLeft: '14px' }}>
                  {aiText}{aiLoading && <span style={{ animation: 'pulse 1s infinite' }}>▊</span>}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Click "Analyze" to get a personalized AI breakdown of your portfolio health, diversification, and trade patterns.
                </div>
              )}
            </motion.div>
          </div>

          {/* Holdings Table */}
          <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>P&L</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrichedHoldings.map(h => (
                  <tr key={h.stockId}>
                    <td>
                      <div className="stock-cell">
                        <div className="stock-icon" style={{ background: `${h.color}20`, color: h.color }}>
                          {h.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="stock-name">{h.name}</div>
                          <div className="stock-symbol">{formatSymbol(h.symbol)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h.quantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.avgBuyPrice?.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.currentPrice?.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.investedValue?.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{h.currentValue?.toLocaleString()}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: h.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {h.pnl >= 0 ? '+' : ''}₹{h.pnl?.toFixed(2)}<br />
                        <span style={{ fontSize: '11px' }}>({h.pnlPct?.toFixed(2)}%)</span>
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/app/trade/${formatSymbol(h.symbol)}`)}>Trade</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </>
      )}
    </div>
  );
}
