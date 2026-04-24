import { useEffect, useState } from 'react';

export default function NewsPopup({ news, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const isPositive = news?.impact > 0;

  useEffect(() => {
    if (!news) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 7000);
    return () => clearTimeout(t);
  }, [news]);

  if (!news) return null;

  return (
    <div className={`arena-news-popup ${visible ? 'show' : 'hide'} ${isPositive ? 'positive' : 'negative'}`}>
      <div className="arena-news-badge">
        <span className="arena-news-dot" style={{ background: isPositive ? '#10b981' : '#ef4444' }} />
        BREAKING
      </div>
      <div className="arena-news-text">{news.text}</div>
      <div className="arena-news-meta">
        <span className="arena-news-sector">{news.sector}</span>
        <span className={`arena-news-impact ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(news.impact)}%
        </span>
      </div>
      <button className="arena-news-close" onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}>×</button>
    </div>
  );
}
