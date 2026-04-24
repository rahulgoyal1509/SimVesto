import { useState, useEffect } from 'react';
import { generatePersona } from './arenaEngine';
import ParticleField from './ParticleField';

export default function PersonaAssignment({ difficulty, onContinue }) {
  const [persona, setPersona] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState(0); // 0=loading, 1=sketch, 2=portfolio, 3=scenario

  useEffect(() => {
    // Simulate AI "generating" for drama
    const t1 = setTimeout(() => { setPersona(generatePersona(difficulty)); setStep(1); }, 1200);
    const t2 = setTimeout(() => setStep(2), 2400);
    const t3 = setTimeout(() => { setStep(3); setRevealed(true); }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [difficulty]);

  const handleContinue = () => onContinue(persona);

  const modeColors = { turbulence: '#10b981', storm: '#f59e0b', blackout: '#6366f1' };
  const color = modeColors[difficulty] || '#1db584';

  const totalValue = persona?.holdings?.reduce((s, h) => s + h.value, 0) || 0;

  return (
    <div className="arena-fullscreen">
      <ParticleField intensity={0.4} />
      <div className="arena-persona-wrap">
        {/* Loading state */}
        {!persona && (
          <div className="arena-generating">
            <div className="arena-gen-spinner" style={{ borderTopColor: color }} />
            <div className="arena-gen-text">AI is assigning your persona...</div>
            <div className="arena-gen-sub">Analyzing 100+ financial profiles</div>
          </div>
        )}

        {persona && (
          <div className={`arena-persona-card ${revealed ? 'revealed' : ''}`}>
            {/* Header */}
            <div className="arena-persona-header">
              <div className="arena-persona-eyebrow" style={{ color }}>⚙ PERSONA ASSIGNED</div>
              <h2 className="arena-persona-title">Your Financial Identity</h2>
            </div>

            {/* Character sketch */}
            {step >= 1 && (
              <div className="arena-persona-sketch animate-in">
                <div className="arena-sketch-icon">👤</div>
                <p className="arena-sketch-text">{persona.sketch}</p>
                <div className="arena-sketch-tags">
                  <span className="arena-tag" style={{ borderColor: `${color}40`, color }}>{persona.profession}</span>
                  <span className="arena-tag" style={{ borderColor: `${color}40`, color }}>{persona.archetype}</span>
                  <span className="arena-tag" style={{ borderColor: `${color}40`, color }}>{persona.lifestage}</span>
                </div>
              </div>
            )}

            {/* Portfolio */}
            {step >= 2 && (
              <div className="arena-persona-portfolio animate-in">
                <div className="arena-section-label">📊 Portfolio Breakdown — {persona.portfolioType}</div>
                <div className="arena-portfolio-table">
                  <div className="arena-portfolio-header">
                    <span>Holding</span><span>Price</span><span>Qty</span><span>Value</span><span>Day Chg</span>
                  </div>
                  {persona.holdings.map((h, i) => (
                    <div key={i} className="arena-portfolio-row">
                      <span className="arena-holding-name">{h.name}</span>
                      <span>₹{h.price.toLocaleString()}</span>
                      <span>{h.qty}</span>
                      <span>₹{h.value.toLocaleString()}</span>
                      <span className={h.dayChange >= 0 ? 'up' : 'down'}>
                        {h.dayChange >= 0 ? '▲' : '▼'}{Math.abs(h.dayChange)}%
                      </span>
                    </div>
                  ))}
                  <div className="arena-portfolio-total">
                    <span>Total Portfolio Value</span>
                    <span style={{ color, fontWeight: 800 }}>₹{totalValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="arena-section-label" style={{ marginTop: 16 }}>📅 Investment Journey</div>
                <div className="arena-timeline">
                  {persona.timeline.map((t, i) => (
                    <div key={i} className="arena-timeline-item">
                      <div className="arena-timeline-dot" style={{ background: color }} />
                      <div>
                        <span className="arena-timeline-year" style={{ color }}>{t.year}</span>
                        <span className="arena-timeline-event">{t.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scenario */}
            {step >= 3 && (
              <div className="arena-persona-scenario animate-in">
                <div className="arena-section-label">🌍 Today's Macro Scenario</div>
                <div className="arena-scenario-card" style={{ borderColor: `${color}40` }}>
                  <div className="arena-scenario-title" style={{ color }}>{persona.scenario.title}</div>
                  <p className="arena-scenario-brief">{persona.scenario.brief}</p>
                  <div className="arena-scenario-sectors">
                    {persona.scenario.affectedSectors.map(s => (
                      <span key={s} className="arena-sector-chip">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="arena-panic-hint">
                  <span>⚠</span>
                  <span>
                    Your panic threshold is calibrated to your persona.
                    {difficulty === 'turbulence' ? ' AI Coach will guide you through pressure points.' :
                      difficulty === 'storm' ? ' AI will give directional hints — decisions are yours.' :
                      ' No AI help. Pure instinct.'}
                  </span>
                </div>

                <button className="arena-continue-btn" style={{ '--btn-color': color }} onClick={handleContinue}>
                  I'm Ready — Begin Simulation →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
