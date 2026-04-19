import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SentimentDashboard({ portfolio, symbols }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_ML_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiUrl}/ml/sentiment-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, user_portfolio: portfolio }),
        });
        const resData = await response.json();
        setData(resData);
      } catch (error) {
        console.error('Sentiment fetch failed:', error);
      }
      setLoading(false);
    };

    if (symbols.length > 0) fetchSentiment();
  }, [portfolio, symbols]);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!data) return <div className="card">No sentiment data available.</div>;

  const getNeedleAngle = (score) => {
    // Score is -1 to 1. Map to -90 to 90 degrees
    return score * 90;
  };

  const needleAngle = getNeedleAngle(data.market_sentiment?.sentiment_score || 0);
  const isHighRisk = data.portfolio_risk_assessment?.overall_risk === "HIGH RISK";

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card container" style={{ position: 'relative', overflow: 'hidden' }}>
      {isHighRisk && (
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--red)', boxShadow: '0 0 10px var(--red)' }}></div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 Real-Time NLP Sentiment
         </h2>
         <div className={`badge ${isHighRisk ? 'badge-red' : 'badge-green'}`}>
             {data.portfolio_risk_assessment?.overall_risk || 'UNKNOWN RISK'}
         </div>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
         <div style={{ background: 'var(--bg-surface-2)', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>FinBERT Market Prediction</h3>
            
            <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'conic-gradient(from 270deg, var(--red) 0deg, var(--bg-surface) 90deg, var(--green) 180deg)', top: 0, left: 0, opacity: 0.15 }}></div>
               
               <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '10px', height: '80px', background: 'var(--text-primary)', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${needleAngle}deg)`, borderRadius: '5px 5px 0 0', transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
               <div style={{ position: 'absolute', bottom: '-10px', left: '50%', width: '20px', height: '20px', background: 'var(--border-default)', transform: 'translateX(-50%)', borderRadius: '50%' }}></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span style={{ textAlign: 'left', color: 'var(--red)' }}>BEARISH</span>
                <span>NEUTRAL</span>
                <span style={{ textAlign: 'right', color: 'var(--green)' }}>BULLISH</span>
            </div>
            
            <h4 style={{ fontSize: '24px', fontWeight: 800, marginTop: '16px', color: data.market_sentiment?.predicted_direction === 'BULLISH' ? 'var(--green)' : data.market_sentiment?.predicted_direction === 'BEARISH' ? 'var(--red)' : 'var(--text-primary)' }}>
                {data.market_sentiment?.predicted_direction}
            </h4>
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px' }}>
               <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>AI Portfolio Action</h3>
               <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>{data.recommendation}</p>
               <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{data.portfolio_risk_assessment?.portfolio_impact}</p>
            </div>
            
            <div>
                <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Scanned Live Headlines (Subset)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', paddingRight: '8px' }}>
                    {data.detailed_analysis?.slice(0, 3).map((item, i) => (
                       <div key={i} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', borderLeft: `3px solid ${item.sentiment?.label === 'POSITIVE' ? 'var(--green)' : item.sentiment?.label === 'NEGATIVE' ? 'var(--red)' : 'var(--border-default)'}` }}>
                          "{item.text}"
                       </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
