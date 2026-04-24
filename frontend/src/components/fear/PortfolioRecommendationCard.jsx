import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import useStore from '../../store/useStore';
import { motion } from 'framer-motion';

export default function PortfolioRecommendations() {
  const [portfolios, setPortfolios] = useState({});
  const user = useStore(s => s.user);

  useEffect(() => {
     api.getPortfolioRecommendations().then(res => setPortfolios(res));
  }, []);

  const getStyle = (type) => {
    if (type === 'HIGH') return { color: '#FF4444', icon: '🛡️' };
    if (type === 'MEDIUM') return { color: '#FFA500', icon: '⚖️' };
    return { color: '#4CAF50', icon: '🚀' };
  };

  if (!Object.keys(portfolios).length) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
       {['HIGH', 'MEDIUM', 'LOW'].map(type => {
         const p = portfolios[type];
         const isMatch = user?.fearClass === type;
         const style = getStyle(type);

         return (
           <motion.div
             key={type}
             whileHover={{ y: -5 }}
             style={{
               padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px',
               border: isMatch ? `2px solid ${style.color}` : '1px solid var(--border-subtle)',
               boxShadow: isMatch ? `0 8px 30px ${style.color}30` : 'var(--shadow-md)',
               position: 'relative'
             }}
           >
             {isMatch && (
                <div style={{ position: 'absolute', top: '-12px', left: '24px', background: style.color, color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  YOUR MATCH
                </div>
             )}
             <div style={{ fontSize: '32px', marginBottom: '12px' }}>{style.icon}</div>
             <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{p.title}</h3>
             <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{p.description}</p>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Risk Profile</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: style.color }}>{p.risk}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expected Return</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.expectedReturn}</span>
             </div>

             <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>ALLOCATION</div>
             {p.allocation.map(a => (
                <div key={a.asset} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{a.asset}</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{a.pct}%</span>
                </div>
             ))}
           </motion.div>
         );
       })}
    </div>
  );
}
