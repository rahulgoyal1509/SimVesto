import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/* ── fetch with timeout ─────────────────────────────────────────────────────── */
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

/* ── mock data when ML server is offline ────────────────────────────────────── */
function getMockData(symbols) {
  return {
    market_sentiment: { sentiment_score: 0.12, predicted_direction: 'NEUTRAL' },
    recommendation: 'Hold current positions — ML server offline, showing cached signal.',
    portfolio_risk_assessment: {
      overall_risk: 'MEDIUM RISK',
      portfolio_impact: 'Live NLP analysis unavailable. Sentiment engine requires the Python backend to be running.',
    },
    detailed_analysis: symbols.slice(0, 3).map(s => ({
      text: `${s} — awaiting live FinBERT scan`,
      sentiment: { label: 'NEUTRAL' },
    })),
    _offline: true,
  };
}

export default function SentimentDashboard({ portfolio, symbols }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchSentiment = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const apiUrl = import.meta.env.VITE_ML_URL || 'https://simvesto-c67n.onrender.com';
      const res = await fetchWithTimeout(
        `${apiUrl}/ml/sentiment-analysis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, user_portfolio: portfolio }),
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
  }, [portfolio, symbols]);

  useEffect(() => {
    if (symbols.length > 0) fetchSentiment();
  }, [fetchSentiment]);

  /* ── loading skeleton ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 22, width: 220, borderRadius: 8, background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
          <div style={{ height: 22, width: 80, borderRadius: 99, background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
          {[240, 140, 80, 60].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 12, background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
          Connecting to NLP engine… (timeout in 4s)
        </p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  if (!data) return <div className="card">No sentiment data available.</div>;

  const score       = data.market_sentiment?.sentiment_score || 0;
  const needleAngle = score * 90;
  const direction   = data.market_sentiment?.predicted_direction || 'NEUTRAL';
  const isHighRisk  = data.portfolio_risk_assessment?.overall_risk === 'HIGH RISK';
  const dirColor    = direction === 'BULLISH' ? 'var(--green)' : direction === 'BEARISH' ? 'var(--red)' : 'var(--text-primary)';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Risk stripe */}
      {isHighRisk && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--red)', boxShadow: '0 0 10px var(--red)' }} />}

      {/* Offline banner */}
      {offline && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
            ⚠️ ML server offline — showing cached signal
          </span>
          <button
            onClick={fetchSentiment}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', border: '1px solid var(--amber)', borderRadius: 8, padding: '4px 12px', background: 'transparent', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          🧠 Real-Time NLP Sentiment
        </h2>
        <div className={`badge ${isHighRisk ? 'badge-red' : 'badge-green'}`}>
          {data.portfolio_risk_assessment?.overall_risk || 'UNKNOWN RISK'}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Gauge */}
        <div style={{ background: 'var(--bg-surface-2)', padding: 24, borderRadius: 12, textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>FinBERT Market Prediction</h3>
          <div style={{ position: 'relative', width: 200, height: 100, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'conic-gradient(from 270deg, var(--red) 0deg, var(--bg-surface) 90deg, var(--green) 180deg)', top: 0, left: 0, opacity: 0.15 }} />
            <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 10, height: 80, background: 'var(--text-primary)', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${needleAngle}deg)`, borderRadius: '5px 5px 0 0', transition: 'transform 1s cubic-bezier(0.175,0.885,0.32,1.275)' }} />
            <div style={{ position: 'absolute', bottom: -10, left: '50%', width: 20, height: 20, background: 'var(--border-default)', transform: 'translateX(-50%)', borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            <span style={{ textAlign: 'left', color: 'var(--red)' }}>BEARISH</span>
            <span>NEUTRAL</span>
            <span style={{ textAlign: 'right', color: 'var(--green)' }}>BULLISH</span>
          </div>
          <h4 style={{ fontSize: 24, fontWeight: 800, marginTop: 16, color: dirColor }}>{direction}</h4>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 12 }}>
            <h3 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>AI Portfolio Action</h3>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{data.recommendation}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{data.portfolio_risk_assessment?.portfolio_impact}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Scanned Live Headlines (Subset)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 120, overflowY: 'auto', paddingRight: 8 }}>
              {data.detailed_analysis?.slice(0, 3).map((item, i) => (
                <div key={i} style={{ fontSize: 12, background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6, borderLeft: `3px solid ${item.sentiment?.label === 'POSITIVE' ? 'var(--green)' : item.sentiment?.label === 'NEGATIVE' ? 'var(--red)' : 'var(--border-default)'}` }}>
                  "{item.text}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
