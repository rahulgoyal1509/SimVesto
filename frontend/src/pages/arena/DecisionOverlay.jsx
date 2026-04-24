import { useEffect, useState, useRef } from 'react';

const DURATION = 18; // seconds

export default function DecisionOverlay({ news, persona, difficulty, onDecide, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [emotionalInput, setEmotionalInput] = useState('');
  const [decided, setDecided] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(DURATION);
    setDecided(false);
    setEmotionalInput('');
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [news]);

  const handleDecide = (action) => {
    if (decided) return;
    setDecided(true);
    clearInterval(intervalRef.current);
    onDecide({ action, timeLeft, emotionalInput });
  };

  const pct = (timeLeft / DURATION) * 100;
  const urgentColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#1db584';

  const ACTIONS = [
    { id: 'hold', label: 'HOLD', icon: '🤲', color: '#10b981', desc: 'Stay the course' },
    { id: 'buy', label: 'BUY MORE', icon: '📈', color: '#3b82f6', desc: 'Buy the dip' },
    { id: 'sell', label: 'SELL', icon: '📉', color: '#ef4444', desc: 'Exit position' },
    { id: 'rebalance', label: 'REBALANCE', icon: '⚖️', color: '#a855f7', desc: 'Adjust allocation' },
  ];

  return (
    <div className="arena-decision-overlay">
      <div className="arena-decision-modal">
        {/* Timer ring */}
        <div className="arena-decision-timer-wrap">
          <svg viewBox="0 0 60 60" className="arena-timer-ring">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="30" cy="30" r="26" fill="none"
              stroke={urgentColor} strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          <span className="arena-timer-number" style={{ color: urgentColor }}>{timeLeft}</span>
        </div>

        <div className="arena-decision-headline">📰 A news just dropped — what's your move?</div>
        <div className="arena-decision-news">{news?.text}</div>

        {difficulty !== 'blackout' && (
          <div className="arena-decision-persona-hint">
            <span style={{ color: '#64748b', fontSize: 12 }}>Your persona: </span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{persona?.profession} · {persona?.archetype}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="arena-decision-actions">
          {ACTIONS.map(a => (
            <button
              key={a.id}
              className={`arena-action-btn ${decided ? 'disabled' : ''}`}
              onClick={() => handleDecide(a.id)}
              style={{ '--btn-color': a.color }}
            >
              <span className="arena-action-icon">{a.icon}</span>
              <span className="arena-action-label">{a.label}</span>
              <span className="arena-action-desc">{a.desc}</span>
            </button>
          ))}
        </div>

        {/* Emotional input */}
        {difficulty !== 'blackout' && (
          <div className="arena-emotional-input-wrap">
            <input
              className="arena-emotional-input"
              placeholder="Or type how you feel... 'I'm scared', 'should I sell?' — AI will respond"
              value={emotionalInput}
              onChange={e => setEmotionalInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && emotionalInput.trim()) handleDecide('hold'); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
