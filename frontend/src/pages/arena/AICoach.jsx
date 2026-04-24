import { useState, useEffect } from 'react';

const AVATAR_COLORS = {
  turbulence: { core: '#1db584', ring: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  storm:      { core: '#f59e0b', ring: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  blackout:   { core: '#6366f1', ring: '#818cf8', glow: 'rgba(99,102,241,0.4)' },
};

export default function AICoach({ difficulty, message, isDecisionMoment }) {
  const [visible, setVisible] = useState(false);
  const [displayedMsg, setDisplayedMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const colors = AVATAR_COLORS[difficulty] || AVATAR_COLORS.turbulence;
  const isBlackout = difficulty === 'blackout';

  useEffect(() => {
    if (!message || isBlackout) return;
    setVisible(true);
    setTyping(true);
    setDisplayedMsg('');
    let i = 0;
    const iv = setInterval(() => {
      setDisplayedMsg(message.slice(0, i + 1));
      i++;
      if (i >= message.length) { clearInterval(iv); setTyping(false); }
    }, 18);
    return () => clearInterval(iv);
  }, [message, isBlackout]);

  if (isBlackout) {
    return (
      <div className="arena-coach-panel blackout">
        <div className="arena-coach-avatar" style={{ background: '#1e1b4b', boxShadow: '0 0 24px rgba(99,102,241,0.3)' }}>
          <div className="arena-coach-avatar-icon" style={{ fontSize: 22 }}>🔇</div>
        </div>
        <div className="arena-coach-bubble blackout-bubble">
          <span style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
            AI Coach disabled in Blackout mode. You're on your own.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`arena-coach-panel ${isDecisionMoment ? 'decision-active' : ''}`}>
      {/* Avatar */}
      <div className="arena-coach-avatar-wrap">
        <div
          className="arena-coach-avatar"
          style={{
            background: `radial-gradient(circle at 40% 35%, ${colors.core}, #0a0a1a)`,
            boxShadow: `0 0 32px ${colors.glow}, 0 0 8px ${colors.ring}`,
          }}
        >
          <div className="arena-coach-avatar-icon">🤖</div>
          <div className="arena-coach-ring" style={{ borderColor: colors.ring }} />
          <div className="arena-coach-ring arena-coach-ring-2" style={{ borderColor: `${colors.ring}60` }} />
        </div>
        <div className="arena-coach-label" style={{ color: colors.core }}>
          AI Coach {difficulty === 'storm' ? '· Hint Mode' : '· Active'}
        </div>
      </div>

      {/* Speech bubble */}
      {visible && displayedMsg && (
        <div className={`arena-coach-bubble ${isDecisionMoment ? 'decision-bubble' : ''}`}
          style={{ borderColor: `${colors.core}40`, boxShadow: `0 4px 24px ${colors.glow}` }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6 }}>
            {displayedMsg}
            {typing && <span className="arena-typing-cursor">|</span>}
          </span>
        </div>
      )}
    </div>
  );
}
