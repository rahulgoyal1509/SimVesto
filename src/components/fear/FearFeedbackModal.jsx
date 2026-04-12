import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import useStore from '../../store/useStore';

const Confetti = () => {
    return (
       <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(50)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ 
                 y: -20, 
                 x: Math.random() * window.innerWidth,
                 scale: Math.random() * 0.8 + 0.5,
                 rotate: 0,
                 backgroundColor: ['#4CAF50','#FF4444','#FFA500','#007AFF'][Math.floor(Math.random() * 4)]
               }}
               animate={{ 
                 y: window.innerHeight,
                 rotate: 360,
                 x: `calc(${Math.random() * 100}vw - 50px)`
               }}
               transition={{ duration: 2 + Math.random() * 2, ease: 'easeOut' }}
               style={{ width: '8px', height: '8px', position: 'absolute' }}
             />
          ))}
       </div>
    );
};

export default function FearFeedbackModal({ isOpen, onClose, logData }) {
   if (!isOpen || !logData) return null;

   const scoreDropped = logData.delta < 0;

   return (
     <AnimatePresence>
       {isOpen && (
         <div style={{
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
           backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
           display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
           {scoreDropped && <Confetti />}
           
           <motion.div
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 50, scale: 0.9 }}
             style={{
               width: '400px', backgroundColor: '#fff', borderRadius: '16px',
               padding: '32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
             }}
           >
             <h2 style={{ margin: '0 0 24px 0', fontFamily: 'var(--font-serif)' }}>Behavioral Impact</h2>
             
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>BEFORE</div>
                   <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{logData.previousScore}</div>
                </div>

                <div style={{ fontSize: '24px', color: scoreDropped ? '#4CAF50' : '#FF4444' }}>
                   ➔
                </div>

                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>AFTER</div>
                   <motion.div 
                     initial={{ scale: 1.5, color: '#007AFF' }}
                     animate={{ scale: 1, color: '#333' }}
                     transition={{ delay: 0.5 }}
                     style={{ fontSize: '32px', fontWeight: 'bold' }}
                   >
                     {logData.score}
                   </motion.div>
                </div>
             </div>

             <div style={{ marginTop: '24px', padding: '16px', backgroundColor: scoreDropped ? '#E8F5E9' : '#FFEBEE', borderRadius: '8px' }}>
               <h4 style={{ margin: 0, color: scoreDropped ? '#2E7D32' : '#C62828' }}>
                 {scoreDropped ? 'Fear Decreased!' : 'Fear Increased'}
               </h4>
               <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#555' }}>
                 {scoreDropped 
                    ? "Practicing and making swift decisions reduces your hesitancy parameter."
                    : "Long hesitations or losses can spike anxiety. Stay the course!"}
               </p>
             </div>

             <button 
               onClick={onClose}
               style={{
                 marginTop: '24px', width: '100%', padding: '14px',
                 backgroundColor: '#007AFF', color: 'white', border: 'none',
                 borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
               }}
             >
               Continue
             </button>
           </motion.div>
         </div>
       )}
     </AnimatePresence>
   );
}
