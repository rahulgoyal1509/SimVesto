import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function PortfolioOptimizerDash({ symbols }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptimization = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_ML_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiUrl}/ml/optimize-portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, risk_tolerance: 'medium' }),
        });
        const resData = await response.json();
        setData(resData);
      } catch (error) {
        console.error('Optimization fetch failed:', error);
      }
      setLoading(false);
    };

    if (symbols.length > 1) {
        fetchOptimization();
    } else {
        setLoading(false);
    }
  }, [symbols]);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!data || symbols.length < 2) return <div className="card">Add more stocks to optimize your portfolio. Math requires multiple assets!</div>;
  if (data.error) return <div className="card" style={{color: 'var(--red)'}}>Failed to optimize: {data.error}</div>;

  const pieData = Object.entries(data.recommended_allocation || {}).map(([name, value]) => ({
      name,
      value: Number((value * 100).toFixed(2))
  })).filter(item => item.value > 0);

  const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>📊 Efficient Frontier Optimizer</h2>
         <div className="badge badge-purple" style={{ fontSize: '11px' }}>Modern Portfolio Theory</div>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
         Calculated mathematically using scipy.optimize algorithms to maximize Sharpe ratio based on 2-year covariance.
      </p>

      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
         {/* Pie Chart */}
         <div style={{ flex: 1, minWidth: '200px', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                    formatter={(value) => [`${value}%`, 'Allocation']}
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '13px' }}
                 />
               </PieChart>
            </ResponsiveContainer>
         </div>
         
         {/* Metrics */}
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
             <div style={{ background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Expected Annual Return</span>
                 <span style={{ fontWeight: 700, color: 'var(--green)' }}>{data.expected_metrics?.annual_return}</span>
             </div>
             <div style={{ background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Historical Volatility</span>
                 <span style={{ fontWeight: 700 }}>{data.expected_metrics?.volatility}</span>
             </div>
             <div style={{ background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Sharpe Ratio (Risk-Adj)</span>
                 <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{data.expected_metrics?.sharpe_ratio}</span>
             </div>
         </div>
      </div>
    </motion.div>
  );
}
