import { useState } from 'react';
import ParticleField from './ParticleField';

const MODES = [
  {
    id: 'turbulence',
    name: 'TURBULENCE',
    icon: '🌊',
    tagline: 'Moderate swings. Full AI guidance. Learn to hold composure.',
    hinglish: '"Market ka darr real hai — but data tere saath hai."',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.35)',
    border: 'rgba(16,185,129,0.5)',
    level: 'BEGINNER',
    features: ['AI Coach fully active', 'Full news context', 'Inactivity hints on', '±3% volatility range'],
  },
  {
    id: 'storm',
    name: 'STORM',
    icon: '⚡',
    tagline: 'Fast, unpredictable spikes. Partial news. Test your instincts.',
    hinglish: '"Brace yourself — the market doesn\'t wait for anyone."',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    border: 'rgba(245,158,11,0.5)',
    level: 'INTERMEDIATE',
    features: ['AI gives hints only', 'Partial news context', 'Less hand-holding', '±7% volatility range'],
  },
  {
    id: 'blackout',
    name: 'BLACKOUT',
    icon: '🌑',
    tagline: 'Severe crashes. Zero context. Pure psychological endurance.',
    hinglish: '"Andhera hai. News nahi. Sirf tu aur tera decision."',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.35)',
    border: 'rgba(99,102,241,0.5)',
    level: 'ADVANCED',
    features: ['No AI guidance', 'Zero news context', 'No hints or signals', '±15% volatility range'],
  },
];

export default function DifficultySelect({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    if (!selected) return;
    setEntering(true);
    setTimeout(() => onSelect(selected), 700);
  };

  return (
    <div className="arena-fullscreen">
      <ParticleField intensity={0.6} />

      <div className="arena-difficulty-wrap">
        {/* Header */}
        <div className="arena-header-section">
          <div className="arena-mode-eyebrow">⚔ SIMVESTO · ARENA MODE</div>
          <h1 className="arena-main-title">Choose Your Battle</h1>
          <p className="arena-subtitle">Select a difficulty. Your psychological training begins the moment you enter.</p>
        </div>

        {/* Mode cards */}
        <div className="arena-mode-grid">
          {MODES.map(mode => (
            <div
              key={mode.id}
              className={`arena-mode-card ${selected === mode.id ? 'selected' : ''}`}
              style={{
                '--mode-color': mode.color,
                '--mode-glow': mode.glow,
                '--mode-border': mode.border,
                borderColor: selected === mode.id ? mode.border : 'rgba(255,255,255,0.06)',
                boxShadow: selected === mode.id ? `0 0 40px ${mode.glow}, 0 8px 32px rgba(0,0,0,0.5)` : '0 4px 24px rgba(0,0,0,0.4)',
              }}
              onClick={() => setSelected(mode.id)}
            >
              <div className="arena-mode-level" style={{ color: mode.color }}>{mode.level}</div>
              <div className="arena-mode-icon" style={{ filter: `drop-shadow(0 0 12px ${mode.color})` }}>{mode.icon}</div>
              <div className="arena-mode-name" style={{ color: mode.color }}>{mode.name}</div>
              <div className="arena-mode-tagline">{mode.tagline}</div>
              <div className="arena-mode-quote">{mode.hinglish}</div>
              <ul className="arena-mode-features">
                {mode.features.map((f, i) => (
                  <li key={i} style={{ color: '#94a3b8' }}>
                    <span style={{ color: mode.color, marginRight: 6 }}>·</span>{f}
                  </li>
                ))}
              </ul>
              {selected === mode.id && (
                <div className="arena-mode-selected-badge" style={{ background: mode.color }}>SELECTED</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="arena-enter-wrap">
          <button
            className={`arena-enter-btn ${!selected ? 'disabled' : ''} ${entering ? 'entering' : ''}`}
            onClick={handleEnter}
            disabled={!selected || entering}
            style={selected ? { '--btn-color': MODES.find(m => m.id === selected)?.color } : {}}
          >
            {entering ? '⚔ Entering Arena...' : selected ? `Enter ${MODES.find(m => m.id === selected)?.name}` : 'Select a Difficulty First'}
          </button>
          {selected && (
            <p className="arena-enter-warning">
              {MODES.find(m => m.id === selected)?.hinglish}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
