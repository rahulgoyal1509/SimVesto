import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import SentimentDashboard from '../components/analytics/SentimentDashboard';
import PortfolioOptimizerDash from '../components/analytics/PortfolioOptimizerDash';

export default function Analytics() {
  const holdings = useStore(s => s.holdings);
  
  // Need to extract portfolio symbols and current allocations for ML engines
  const { symbols, portfolioAllocation } = useMemo(() => {
     if (!holdings || holdings.length === 0) return { symbols: ['RELIANCE.NS', 'TCS.NS'], portfolioAllocation: {'RELIANCE.NS': 0.5, 'TCS.NS': 0.5} };
     
     const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0) || 1;
     const syms = [];
     const alloc = {};
     
     holdings.forEach(h => {
         // YFinance needs .NS for Indian stocks if they don't have it (optional, depending on DB)
         const symbol = h.symbol.includes('.NS') || h.symbol.includes('.BO') || h.symbol.length <= 4 
                       ? h.symbol 
                       : `${h.symbol}.NS`;
                       
         syms.push(symbol);
         alloc[symbol] = h.currentValue / totalValue;
     });
     
     // Math requires at least 2 assets to calculate covariance. If user only has 1 stock, fallback to include the Market Index.
     if (syms.length === 1) {
         syms.push('^NSEI');
         alloc['^NSEI'] = 0.001; // Tiny mock weight
     }
     
     return { symbols: syms, portfolioAllocation: alloc };
  }, [holdings]);

  // Market Anomaly Live Stream
  const [anomaly, setAnomaly] = useState(null);

  useEffect(() => {
      // Connect to FastAPI WebSocket for Feature 4: Anomaly Detection
      const wsUrl = import.meta.env.VITE_ML_WS_URL || 'https://simvesto-c67n.onrender.com/ws/market-anomalies';
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.alert && data.alert.anomaly_detected) {
              setAnomaly(data.alert);
              // Clear the alert after 8 seconds visually
              setTimeout(() => setAnomaly(null), 8000);
          }
      };
      
      return () => ws.close();
  }, []);

  return (
    <div>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>⚡</span> Market Intelligence
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
           Production-Grade Machine Learning & Quantitative Analytics Network.
        </p>
      </motion.div>

      {/* Extreme Volatility / Anomaly Banner (Feature 4 UI) */}
      {anomaly && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--red)', 
                padding: '16px 20px', 
                borderRadius: '8px', 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
            }}
          >
              <div>
                  <h4 style={{ color: 'var(--red)', fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                      ⚠️ {anomaly.market_status.replace('_', ' ')} DETECTED
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Isolation Forest Algorithm has flagged abnormal market liquidity (Score: {anomaly.anomaly_score.toFixed(3)}). High risk of flash crashes!
                  </p>
              </div>
              <div className="badge badge-red" style={{ animation: 'pulse 2s infinite' }}>{anomaly.severity}</div>
          </motion.div>
      )}

      {/* Analytics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         
         {/* Feature 1: Real-time Sentiment (NLP) */}
         <SentimentDashboard portfolio={portfolioAllocation} symbols={symbols} />

         {/* Feature 2: Portfolio Optimizer */}
         <div className="grid-2" style={{ gap: '24px' }}>
             <PortfolioOptimizerDash symbols={symbols} />
             
             {/* Note block for Hackathon */}
             <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>About the Engine</h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                     This dashboard is powered by a custom Python Microservice operating parallel to the Node.js backend. 
                 </p>
                 <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', paddingLeft: '20px' }}>
                     <li><strong>Feature 1:</strong> HuggingFace FinBERT Pipeline for NLP Market Analysis</li>
                     <li><strong>Feature 2:</strong> Modern Portfolio Theory (MPT) via SciPy.optimize</li>
                     <li><strong>Feature 3:</strong> Deep Learning Behavioral Pattern LSTM</li>
                     <li><strong>Feature 4:</strong> Live Unsupervised Isolation Forests for Anomalies</li>
                 </ul>
             </div>
         </div>
      </div>
    </div>
  );
}
