import React from 'react';
import useStore from '../../store/useStore';
import { motion } from 'framer-motion';

const MILESTONES = [
  { target: 90, label: 'First Step', icon: '🐣' },
  { target: 80, label: 'Curious', icon: '👀' },
  { target: 70, label: 'Practitioner', icon: '📝' },
  { target: 60, label: 'Medium Fear', icon: '⚖️' },
  { target: 50, label: 'Balanced', icon: '🏃' },
  { target: 40, label: 'Strategist', icon: '🧭' },
  { target: 30, label: 'Low Fear', icon: '🦅' },
  { target: 10, label: 'Fearless Investor', icon: '👑' },
];

export default function MilestoneTracker() {
  const score = useStore(s => s.user?.fearScore) || 80;

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
       <h3 style={{ margin: '0 0 8px 0' }}>Fear Milestones</h3>
       <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666' }}>
         Unlock badges as your fear score decreases towards 0. Current: <strong>{score}</strong>
       </p>

       <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {MILESTONES.map((m, i) => {
             const unlocked = score <= m.target;
             return (
                <motion.div 
                  key={m.target}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    flexShrink: 0, width: '120px', height: '140px',
                    backgroundColor: unlocked ? '#F0FDF4' : '#FAFAFA',
                    border: `1px solid ${unlocked ? '#4CAF50' : '#E0E0E0'}`,
                    borderRadius: '12px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', opacity: unlocked ? 1 : 0.5,
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{unlocked ? m.icon : '🔒'}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 8px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    Score &le; {m.target}
                  </div>
                  
                  {unlocked && (
                     <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#4CAF50', fontSize: '12px' }}>
                       ✓
                     </div>
                  )}
                </motion.div>
             );
          })}
       </div>
    </div>
  );
}
