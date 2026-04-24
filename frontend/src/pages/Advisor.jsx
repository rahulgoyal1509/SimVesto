import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import useStore from '../store/useStore';
import { runMonteCarlo, getSuggestionColor, getSuggestionEmoji } from '../engine/monteCarlo';
import { generateNarration } from '../engine/aiNarrator';

const HORIZONS = [
  { label: '1 Month', days: 21 },
  { label: '3 Months', days: 63 },
  { label: '6 Months', days: 126 },
  { label: '1 Year', days: 252 },
];

export default function Advisor() {
  const stocks = useStore(s => s.stocks);
  const user = useStore(s => s.user);
  const fearScore = useStore(s => s.fearScore);
  const geminiApiKey = useStore(s => s.geminiApiKey);
  const addSimulation = useStore(s => s.addSimulation);

  const [selectedStock, setSelectedStock] = useState(stocks[0]?.id);
  const [investment, setInvestment] = useState(1000);
  const [horizon, setHorizon] = useState(63);
  const [mcResult, setMcResult] = useState(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showPaths, setShowPaths] = useState(false);

  const stock = useMemo(() => stocks.find(s => s.id === selectedStock), [stocks, selectedStock]);

  const analyze = () => {
    if (!stock) return;
    setMcLoading(true);
    setMcResult(null);
    setAiText('');
    setShowPaths(true);

    setTimeout(() => {
      const result = runMonteCarlo({
        currentPrice: stock.currentPrice,
        drift: stock.drift,
        volatility: stock.volatility,
        horizonDays: horizon,
        investment,
      });
      setMcResult(result);
      setMcLoading(false);

      addSimulation({ stockId: stock.id, symbol: stock.symbol, name: stock.name, ...result, timestamp: Date.now() });

      setAiLoading(true);
      generateNarration({
        apiKey: geminiApiKey,
        context: {
          type: 'trade_suggestion', fearScore: fearScore.score, fearClass: fearScore.fearClass,
          literacyScore: user?.literacyScore || 5, stockName: stock.name, stockSymbol: stock.symbol, mcResult: result,
        },
        onToken: (text) => setAiText(text),
      }).then(() => setAiLoading(false));
    }, 800);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>AI Advisor 🤖</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monte Carlo simulation — 1,000 scenarios to evaluate any trade</p>
      </motion.div>

      {/* Controls */}
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '20px', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label className="form-label">Stock</label>
            <select value={selectedStock} onChange={e => setSelectedStock(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', cursor: 'pointer' }}>
              {stocks.map(s => (
                <option key={s.id} value={s.id}>{s.name} (₹{s.currentPrice.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Investment (Coins)</label>
            <input type="number" className="form-input" min={100} value={investment}
              onChange={e => setInvestment(Math.max(100, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label className="form-label">Time Horizon</label>
            <select value={horizon} onChange={e => setHorizon(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', cursor: 'pointer' }}>
              {HORIZONS.map(h => <option key={h.days} value={h.days}>{h.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={analyze} disabled={mcLoading}
            style={{ height: '44px', whiteSpace: 'nowrap' }}>
            {mcLoading ? <span className="spinner" /> : '▶ Run Simulation'}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {mcResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Suggestion */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              fontSize: '36px', padding: '12px 28px', borderRadius: 'var(--radius-lg)',
              background: `${getSuggestionColor(mcResult.suggestion)}15`,
              border: `2px solid ${getSuggestionColor(mcResult.suggestion)}40`,
              fontFamily: 'var(--font-mono)', fontWeight: 800, color: getSuggestionColor(mcResult.suggestion),
            }}>
              {getSuggestionEmoji(mcResult.suggestion)} {mcResult.suggestion}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {mcResult.suggestion === 'GOOD' ? 'This trade looks favorable' :
                 mcResult.suggestion === 'RISKY' ? 'This trade carries significant risk' :
                 'This trade has moderate risk-reward'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Based on 1,000 Monte Carlo simulated scenarios · Loss probability: {mcResult.lossProbability}%
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
            {/* Confidence Bands Chart */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Projected Value Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={mcResult.percentileData}>
                  <defs>
                    <linearGradient id="mcGrad95" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mcGrad50" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} width={60} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v) => `₹${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="p95" stroke="#10b981" fill="url(#mcGrad95)" strokeWidth={1.5} dot={false} name="Best (P95)" />
                  <Area type="monotone" dataKey="p75" stroke="#34d399" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="P75" />
                  <Area type="monotone" dataKey="p50" stroke="#7c3aed" fill="url(#mcGrad50)" strokeWidth={2} dot={false} name="Expected (P50)" />
                  <Area type="monotone" dataKey="p25" stroke="#f59e0b" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="P25" />
                  <Area type="monotone" dataKey="p5" stroke="#ef4444" fill="none" strokeWidth={1.5} dot={false} name="Worst (P5)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Outcome Cards + AI */}
            <div>
              <div className="grid-3" style={{ gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Best Case', value: mcResult.bestCase, color: 'var(--green)', icon: '🚀', sub: 'P95' },
                  { label: 'Expected', value: mcResult.expectedCase, color: 'var(--accent-purple-light)', icon: '📊', sub: 'P50' },
                  { label: 'Worst Case', value: mcResult.worstCase, color: 'var(--red)', icon: '⚠️', sub: 'P5' },
                ].map((c, i) => {
                  const returnPct = ((c.value - investment) / investment * 100).toFixed(1);
                  return (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{c.icon}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: c.color, margin: '4px 0' }}>
                        ₹{c.value.toLocaleString()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: c.value >= investment ? 'var(--green)' : 'var(--red)' }}>
                        {returnPct >= 0 ? '+' : ''}{returnPct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Analysis */}
              <div className="card" style={{
                borderLeft: '3px solid var(--accent-purple)', padding: '16px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple-light)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🤖 AI Analysis
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {aiText || 'Running AI analysis...'}
                  {aiLoading && <span style={{ animation: 'pulse 1s infinite' }}>▊</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
