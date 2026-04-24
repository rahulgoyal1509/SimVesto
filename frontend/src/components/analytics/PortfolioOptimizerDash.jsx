import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

async function fetchWithTimeout(url, options, ms = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/* ── mock offline data ───────────────────────────────────────────────────────── */
function getMockData(symbols) {
  const n = symbols.length || 1;
  const evenWeight = (1 / n);
  const recommended_allocation = Object.fromEntries(symbols.map(s => [s, evenWeight]));
  return {
    recommended_allocation,
    expected_metrics: {
      annual_return: '~12.4%',
      volatility: '~18.2%',
      sharpe_ratio: '~0.68',
    },
    _offline: true,
  };
}

export default function PortfolioOptimizerDash({ symbols }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchOptimization = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const apiUrl = import.meta.env.VITE_ML_URL || 'https://simvesto-c67n.onrender.com';
      const res = await fetchWithTimeout(
        `${apiUrl}/ml/optimize-portfolio`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, risk_tolerance: 'medium' }),
        },
        4000
      );
      const resData = await res.json();
      setData(resData);
    } catch {
      setData(getMockData(symbols));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (symbols.length > 1) {
      fetchOptimization();
    } else {
      setLoading(false);
    }
  }, [fetchOptimization]);

  /* ── loading skeleton ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 28 }}>
        <div style={{ height: 22, width: 240, borderRadius: 8, background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[60, 60, 60].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 12, background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          Running Efficient Frontier… (timeout in 4s)
        </p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  if (symbols.length < 2) {
    return <div className="card">Add more stocks to optimize your portfolio. Math requires multiple assets!</div>;
  }

  if (!data) return null;
  if (data.error) return <div className="card" style={{ color: 'var(--red)' }}>Failed to optimize: {data.error}</div>;

  const pieData = Object.entries(data.recommended_allocation || {})
    .map(([name, value]) => ({ name, value: Number((value * 100).toFixed(2)) }))
    .filter(item => item.value > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📊 Efficient Frontier Optimizer</h2>
        <div className="badge badge-purple" style={{ fontSize: 11 }}>Modern Portfolio Theory</div>
      </div>

      {/* Offline banner */}
      {offline && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
            ⚠️ ML server offline — showing equal-weight fallback
          </span>
          <button
            onClick={fetchOptimization}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', border: '1px solid var(--amber)', borderRadius: 8, padding: '4px 12px', background: 'transparent', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
        {offline
          ? 'Showing equal-weight allocation. Connect the Python ML engine for Sharpe-optimised weights.'
          : 'Calculated using scipy.optimize to maximise Sharpe ratio based on 2-year covariance.'}
      </p>

      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* Pie */}
        <div style={{ flex: 1, minWidth: 200, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip
                formatter={v => [`${v}%`, 'Allocation']}
                contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          {[
            { label: 'Expected Annual Return', val: data.expected_metrics?.annual_return, color: 'var(--green)' },
            { label: 'Historical Volatility',   val: data.expected_metrics?.volatility,    color: undefined },
            { label: 'Sharpe Ratio (Risk-Adj)', val: data.expected_metrics?.sharpe_ratio,  color: 'var(--primary)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
              <span style={{ fontWeight: 700, color }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
