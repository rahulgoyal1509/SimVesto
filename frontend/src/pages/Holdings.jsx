import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useStore from '../store/useStore';

const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

export default function Holdings() {
  const holdings = useStore(s => s.holdings);
  const stocks = useStore(s => s.stocks);
  const user = useStore(s => s.user);
  const orders = useStore(s => s.orders);
  const navigate = useNavigate();
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deepDiveList, setDeepDiveList] = useState([]);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);

  const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');

  const enrichedHoldings = useMemo(() => {
    return holdings.map(h => {
      const stock = stocks.find(s => s.id === h.stockId);
      const currentPrice = stock?.currentPrice || h.currentPrice || h.avgBuyPrice;
      const currentValue = h.quantity * currentPrice;
      const investedValue = h.quantity * h.avgBuyPrice;
      const pnl = currentValue - investedValue;
      const pnlPct = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
      
      return {
        ...h,
        currentPrice: parseFloat(currentPrice?.toFixed(2) || 0),
        currentValue: parseFloat(currentValue.toFixed(2)),
        investedValue: parseFloat(investedValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct: parseFloat(pnlPct.toFixed(2)),
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

  const formatAnalysisText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const analyzeDeepDive = async () => {
    setDeepDiveLoading(true);
    const nextDepth = deepDiveList.length + 2; // depth 2, 3, 4, etc.
    
    // Add a new empty dive object
    setDeepDiveList(prev => [...prev, { depth: nextDepth, text: '' }]);
    
    try {
      const { api } = await import('../services/api.js');
      const response = await api.analyzePortfolio(nextDepth);
      
      if (response.analysis) {
        const text = response.analysis;
        let streamedText = '';
        
        // Stream the response char by char
        for (let i = 0; i < text.length; i++) {
          await new Promise(r => setTimeout(r, 8 + Math.random() * 10));
          streamedText = text.slice(0, i + 1);
          setDeepDiveList(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { depth: nextDepth, text: streamedText };
            return updated;
          });
        }
      } else {
        setDeepDiveList(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = 'Could not generate deep dive analysis.';
          return updated;
        });
      }
    } catch (error) {
      console.error('Deep dive error:', error);
      setDeepDiveList(prev => {
        const updated = [...prev];
        updated[updated.length - 1].text = 'Error generating deep dive analysis.';
        return updated;
      });
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const analyzePortfolio = async () => {
    setAiLoading(true);
    setAiText('loading');
    try {
      const { api } = await import('../services/api.js');
      const response = await api.analyzePortfolio();
      
      if (response.analysis) {
        setAiText(''); // Clear loading state
        const text = response.analysis;
        // Stream the response char by char
        for (let i = 0; i < text.length; i++) {
          await new Promise(r => setTimeout(r, 10 + Math.random() * 12));
          setAiText(text.slice(0, i + 1));
        }
      } else {
        setAiText('Could not generate analysis. Please try again.');
      }
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      setAiText('Error connecting to analysis service. Please try again.');
    } finally {
      setAiLoading(false);
    }
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
              
              {aiLoading && aiText === 'loading' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  Analyzing your portfolio...
                </div>
              ) : aiText && aiText !== 'loading' ? (
                <>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, borderLeft: '3px solid var(--accent-purple)', paddingLeft: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px', background: 'rgba(124, 58, 237, 0.03)', padding: '12px 8px 12px 14px', borderRadius: 'var(--radius-md)' }}>
                    {formatAnalysisText(aiText)}{aiLoading && <span style={{ animation: 'pulse 1s infinite', marginLeft: '4px' }}>▊</span>}
                  </div>
                  
                  {/* Deep Dive Analyses Stacked Below Main Analysis */}
                  {deepDiveList.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                      {deepDiveList.map((dive, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          style={{ marginBottom: idx < deepDiveList.length - 1 ? '16px' : '0', paddingBottom: idx < deepDiveList.length - 1 ? '16px' : '0', borderBottom: idx < deepDiveList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            💎 Level {dive.depth} Deep Dive {idx === deepDiveList.length - 1 && deepDiveLoading && <span className="spinner" style={{ width: '10px', height: '10px', display: 'inline-block', marginLeft: '6px' }} />}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, borderLeft: '3px solid var(--accent-blue)', paddingLeft: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px', background: 'rgba(59, 130, 246, 0.05)', padding: '12px 12px 12px 14px', borderRadius: 'var(--radius-md)' }}>
                            {formatAnalysisText(dive.text)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Get Deeper Insights Button */}
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={analyzeDeepDive}
                    disabled={deepDiveLoading}
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    {deepDiveLoading ? (
                      <>
                        <span className="spinner" style={{ width: '12px', height: '12px', marginRight: '6px', display: 'inline-block' }} />
                        Generating Level {deepDiveList.length + 2} Deep Dive...
                      </>
                    ) : (
                      `💎 Get Deeper Insights (Level ${deepDiveList.length + 2})`
                    )}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Click "Analyze" to get a comprehensive AI assessment of your portfolio health, patterns, and actionable next steps. Then unlock deeper insights with the Deep Dive feature.
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
                        {h.pnl >= 0 ? '+₹' : '−₹'}{Math.abs(h.pnl)?.toFixed(2)}<br />
                        <span style={{ fontSize: '11px' }}>({h.pnlPct >= 0 ? '+' : '−'}{Math.abs(h.pnlPct)?.toFixed(2)}%)</span>
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
