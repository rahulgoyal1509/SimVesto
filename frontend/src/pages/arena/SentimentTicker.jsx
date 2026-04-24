import { useEffect, useRef, useState } from 'react';
import { computeSentiment } from './arenaEngine';

const LABELS = ['FEARFUL', 'PANIC ZONE', 'NEUTRAL', 'CAUTIOUS', 'BULLISH', 'FEARFUL', 'NEUTRAL', 'BULLISH', 'PANIC ZONE', 'CAUTIOUS'];

export default function SentimentTicker({ priceChangePct = 0, difficulty = 'turbulence' }) {
  const sentiment = computeSentiment(priceChangePct, difficulty);
  const tickerRef = useRef(null);
  const [items] = useState(() => {
    // Build a long repeating strip
    return Array.from({ length: 40 }, (_, i) => ({
      label: LABELS[i % LABELS.length],
      color: ['#ff1a1a','#f97316','#94a3b8','#eab308','#10b981'][i % 5],
    }));
  });

  return (
    <div className="arena-sentiment-bar">
      <div className="arena-sentiment-live">
        <span className="arena-sentiment-dot" style={{ background: sentiment.color, boxShadow: `0 0 8px ${sentiment.color}` }} />
        <span style={{ color: sentiment.color, fontWeight: 800, letterSpacing: '0.08em', fontSize: 12 }}>
          {sentiment.label}
        </span>
        <span style={{ color: '#475569', fontSize: 11, marginLeft: 6 }}>LIVE SENTIMENT</span>
      </div>
      <div className="arena-sentiment-scroll-wrapper" ref={tickerRef}>
        <div className="arena-sentiment-scroll">
          {items.concat(items).map((item, i) => (
            <span key={i} className="arena-sent-chip" style={{ color: item.color, borderColor: `${item.color}30` }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="arena-sentiment-finbert">
        <span style={{ color: '#334155', fontSize: 10, fontWeight: 600 }}>FinBERT</span>
        <span className="arena-finbert-dot" />
      </div>
    </div>
  );
}
