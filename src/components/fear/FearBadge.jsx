import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const getStyleVars = (score) => {
  if (score >= 67) return { base: '#FF4444', text: 'HIGH', subtitle: 'Hesitant - Needs practice' };
  if (score >= 34) return { base: '#FFA500', text: 'MEDIUM', subtitle: 'Learning - Building confidence' };
  return { base: '#4CAF50', text: 'LOW', subtitle: 'Confident - Ready to invest' };
};

export default function FearBadge({ score = 80, size = 'medium' }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { base, text, subtitle } = getStyleVars(score);

  const styleMap = {
    large: { width: '300px', height: '250px', fontScore: '48px', fontText: '16px', padding: '24px' },
    medium: { width: '200px', height: '180px', fontScore: '36px', fontText: '14px', padding: '16px' },
    small: { width: '150px', height: '120px', fontScore: '24px', fontText: '12px', padding: '12px' },
  };
  const styles = styleMap[size] || styleMap.medium;

  return (
    <motion.div
      onClick={() => navigate('/app/insights')}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: styles.width,
        height: styles.height,
        padding: styles.padding,
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        border: `2px solid ${base}`,
        boxShadow: hovered ? `0 8px 24px ${base}40` : '0 4px 12px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'box-shadow 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>
        FEAR SCORE
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', color: base }}>
        <span style={{ fontSize: styles.fontScore, fontWeight: 800 }}>{score}</span>
        <span style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.7 }}>/100</span>
      </div>

      <div style={{ width: '100%', height: '8px', backgroundColor: '#F5F5F5', borderRadius: '4px', margin: '12px 0' }}>
        <motion.div
           initial={{ width: 0 }}
           animate={{ width: `${score}%` }}
           transition={{ duration: 1, type: 'spring' }}
           style={{ height: '100%', backgroundColor: base, borderRadius: '4px' }}
        />
      </div>

      <div style={{ fontSize: styles.fontText, fontWeight: 'bold', color: '#333' }}>
        {text} FEAR
      </div>

      {hovered && size !== 'small' && (
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           style={{
             position: 'absolute',
             bottom: 0, left: 0, right: 0,
             backgroundColor: base,
             color: '#fff',
             fontSize: '11px',
             padding: '8px',
             textAlign: 'center'
           }}
        >
          {subtitle}
        </motion.div>
      )}
    </motion.div>
  );
}
