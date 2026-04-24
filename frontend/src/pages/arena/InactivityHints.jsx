import { useEffect, useState } from 'react';

const HINTS = [
  { signal: 'HOLD', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🟢', msg: 'Pattern suggests holding' },
  { signal: 'CAUTION', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🟡', msg: 'Tread carefully here' },
  { signal: 'HIGH RISK', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔴', msg: 'Elevated risk zone' },
];

export default function InactivityHints({ inactiveSeconds, difficulty, drawdownPct }) {
  const [hints, setHints] = useState([]);
  const [nextId, setNextId] = useState(0);

  const threshold = difficulty === 'turbulence' ? 6 : difficulty === 'storm' ? 8 : 999;

  useEffect(() => {
    if (difficulty === 'blackout') return;
    if (inactiveSeconds < threshold) return;

    // Pick hint based on drawdown
    let hintIdx = 0;
    if (drawdownPct < -4) hintIdx = 2;
    else if (drawdownPct < -1.5) hintIdx = 1;
    else hintIdx = 0;

    const id = nextId;
    setNextId(p => p + 1);
    setHints(prev => [...prev.slice(-3), { ...HINTS[hintIdx], id, x: 15 + Math.random() * 60, y: 30 + Math.random() * 40 }]);

    const t = setTimeout(() => {
      setHints(prev => prev.filter(h => h.id !== id));
    }, 4000);
    return () => clearTimeout(t);
  }, [Math.floor(inactiveSeconds / threshold)]);

  return (
    <div className="arena-hints-layer">
      {hints.map(hint => (
        <div
          key={hint.id}
          className="arena-hint-float"
          style={{
            left: `${hint.x}%`,
            top: `${hint.y}%`,
            background: hint.bg,
            borderColor: `${hint.color}50`,
            color: hint.color,
          }}
        >
          <span>{hint.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>{hint.signal}</span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{hint.msg}</span>
        </div>
      ))}
    </div>
  );
}
