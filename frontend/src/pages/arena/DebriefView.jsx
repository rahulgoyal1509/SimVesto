import { useMemo, useState } from 'react';
import { scoreDecision } from './arenaEngine';
import ParticleField from './ParticleField';

const TAG_COLORS = { good: '#10b981', bad: '#ef4444', neutral: '#f59e0b' };

function generateAISummary(decisions, totalScore, userPnlPct, ghostPnlPct) {
  const panics = decisions.filter(d => d.action === 'sell' && d.ghostAction === 'hold').length;
  const timeouts = decisions.filter(d => d.action === 'timeout').length;
  const total = decisions.length;
  const holds = decisions.filter(d => d.action === 'hold').length;

  if (total === 0) return 'No decision moments were triggered this session. Try a longer or higher-difficulty run.';

  let summary = '';
  if (panics > total / 2) {
    summary = `You panic-sold in ${panics} of ${total} decision moments — faster than the Ghost investor in each case. Next session will target similar high-pressure news scenarios until your hold rate improves.`;
  } else if (timeouts > 1) {
    summary = `You missed ${timeouts} decision windows entirely. In real markets, inaction during high-volatility moments can be as costly as the wrong action. Practice responding under time pressure.`;
  } else if (holds >= total * 0.75) {
    summary = `Excellent composure — you held ${holds} of ${total} decision moments. Your behavioral discipline ${userPnlPct > ghostPnlPct ? 'even beat' : 'closely matched'} the Ghost Portfolio. Next session will escalate difficulty.`;
  } else {
    summary = `Mixed session — you made deliberate decisions in most moments. Score: ${totalScore} pts. Focus on consistency in fast-moving scenarios next time.`;
  }
  return summary;
}

export default function DebriefView({ sessionData, onRestart, onHome }) {
  const { difficulty, persona, decisions, ghostDecisions, priceHistory, finalValue, initialValue, duration } = sessionData;
  const [activeTab, setActiveTab] = useState('timeline');

  const userPnlPct = ((finalValue - initialValue) / initialValue) * 100;

  // Compute ghost final value (simulate)
  const ghostFinalValue = useMemo(() => {
    let val = initialValue;
    ghostDecisions.forEach(g => {
      if (g.action === 'hold') val *= 1.002;
      else if (g.action === 'buy') val *= 1.015;
      else if (g.action === 'sell') val *= 0.998;
      else if (g.action === 'rebalance') val *= 1.005;
    });
    return val;
  }, [ghostDecisions, initialValue]);

  const ghostPnlPct = ((ghostFinalValue - initialValue) / initialValue) * 100;

  // Score all decisions
  const scoredDecisions = useMemo(() => {
    return decisions.map((d, i) => {
      const ghost = ghostDecisions[i] || { action: 'hold', reason: 'Default hold', points: 10 };
      const scored = scoreDecision(d.action, ghost, d.drawdown, persona, d.timeLeft || 0);
      return { ...d, ghost, scored };
    });
  }, [decisions, ghostDecisions, persona]);

  const totalScore = scoredDecisions.reduce((s, d) => s + (d.scored?.pts || 0), 0);
  const aiSummary = generateAISummary(decisions, totalScore, userPnlPct, ghostPnlPct);

  const modeColor = { turbulence: '#10b981', storm: '#f59e0b', blackout: '#6366f1' }[difficulty];
  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const beatGhost = userPnlPct >= ghostPnlPct;

  // Save to history
  useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('arena_history') || '[]');
      history.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN'),
        difficulty,
        persona: `${persona.profession} · ${persona.city}`,
        score: totalScore,
        userPnl: userPnlPct.toFixed(2),
        ghostPnl: ghostPnlPct.toFixed(2),
        beatGhost,
        summary: aiSummary,
        duration,
      });
      localStorage.setItem('arena_history', JSON.stringify(history.slice(0, 20)));
    } catch { }
  }, []);

  return (
    <div className="arena-fullscreen">
      <ParticleField intensity={0.3} />
      <div className="arena-debrief-wrap">
        {/* Header */}
        <div className="arena-debrief-header">
          <div className="arena-debrief-eyebrow" style={{ color: modeColor }}>⚔ SESSION COMPLETE · {difficulty.toUpperCase()}</div>
          <h1 className="arena-debrief-title">Your Arena Debrief</h1>
          <div className="arena-debrief-meta">
            {persona.profession} · {persona.city} · {formatTime(duration)} session
          </div>
        </div>

        {/* Score cards */}
        <div className="arena-score-grid">
          <div className="arena-score-card" style={{ borderColor: `${modeColor}40` }}>
            <div className="arena-score-label">YOUR SCORE</div>
            <div className="arena-score-value" style={{ color: modeColor }}>{totalScore > 0 ? '+' : ''}{totalScore}</div>
            <div className="arena-score-sub">behavioral points</div>
          </div>
          <div className="arena-score-card">
            <div className="arena-score-label">YOUR NET WORTH</div>
            <div className={`arena-score-value ${userPnlPct >= 0 ? 'up' : 'down'}`}>
              ₹{Math.round(finalValue).toLocaleString()}
            </div>
            <div className={`arena-score-pnl ${userPnlPct >= 0 ? 'up' : 'down'}`}>
              {userPnlPct >= 0 ? '▲' : '▼'} {Math.abs(userPnlPct).toFixed(2)}%
            </div>
          </div>
          <div className="arena-score-card ghost">
            <div className="arena-score-label">👻 GHOST PORTFOLIO</div>
            <div className="arena-score-value ghost-val">₹{Math.round(ghostFinalValue).toLocaleString()}</div>
            <div className={`arena-score-pnl ${ghostPnlPct >= 0 ? 'up' : 'down'}`}>
              {ghostPnlPct >= 0 ? '▲' : '▼'} {Math.abs(ghostPnlPct).toFixed(2)}%
            </div>
          </div>
          <div className={`arena-score-card ${beatGhost ? 'win' : 'loss'}`}>
            <div className="arena-score-label">RESULT</div>
            <div className="arena-score-value" style={{ fontSize: 32 }}>{beatGhost ? '🏆' : '📖'}</div>
            <div className="arena-score-sub">{beatGhost ? 'You beat the Ghost!' : 'Ghost wins this round'}</div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="arena-ai-summary" style={{ borderColor: `${modeColor}30` }}>
          <div className="arena-ai-summary-label" style={{ color: modeColor }}>🤖 AI Analysis</div>
          <p className="arena-ai-summary-text">{aiSummary}</p>
        </div>

        {/* Tabs */}
        <div className="arena-debrief-tabs">
          {['timeline', 'comparison', 'patterns'].map(tab => (
            <button key={tab} className={`arena-tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={activeTab === tab ? { borderColor: modeColor, color: modeColor } : {}}
              onClick={() => setActiveTab(tab)}>
              {tab === 'timeline' ? '📋 Decision Timeline' : tab === 'comparison' ? '👻 Ghost Comparison' : '🧠 Behavioral Patterns'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'timeline' && (
          <div className="arena-timeline-debrief">
            {scoredDecisions.length === 0 ? (
              <div className="arena-empty-state">No decision moments were triggered. Try a longer session!</div>
            ) : scoredDecisions.map((d, i) => (
              <div key={i} className={`arena-decision-item ${d.action === 'timeout' ? 'timeout' : d.scored.pts > 0 ? 'good' : 'bad'}`}>
                <div className="arena-decision-time">{formatTime(d.time)}</div>
                <div className="arena-decision-body">
                  <div className="arena-decision-news-text">{d.news}</div>
                  <div className="arena-decision-actions-row">
                    <span className="arena-decision-action-badge" style={{ background: d.action === 'hold' ? '#10b98120' : d.action === 'sell' ? '#ef444420' : '#3b82f620', color: d.action === 'hold' ? '#10b981' : d.action === 'sell' ? '#ef4444' : '#3b82f6' }}>
                      You: {d.action?.toUpperCase()}
                    </span>
                    <span className="arena-decision-vs">vs</span>
                    <span className="arena-decision-action-badge ghost-badge">Ghost: {d.ghost.action?.toUpperCase()}</span>
                  </div>
                  <div className="arena-decision-tags">
                    {d.scored.tags.map((tag, j) => (
                      <span key={j} className="arena-behavior-tag" style={{ color: TAG_COLORS[tag.type], borderColor: `${TAG_COLORS[tag.type]}40` }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <div className="arena-decision-points">
                    {d.scored.pts > 0 ? '+' : ''}{d.scored.pts} pts
                  </div>
                </div>
                <div className="arena-decision-drawdown" style={{ color: d.drawdown < 0 ? '#ef4444' : '#10b981' }}>
                  {d.drawdown.toFixed(1)}% portfolio
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="arena-comparison-grid">
            <div className="arena-comparison-col user">
              <div className="arena-comparison-header">YOUR DECISIONS</div>
              {scoredDecisions.map((d, i) => (
                <div key={i} className="arena-comparison-row">
                  <span className="arena-comp-time">{formatTime(d.time)}</span>
                  <span className="arena-comp-action">{d.action?.toUpperCase()}</span>
                  <span className="arena-comp-pts" style={{ color: d.scored.pts > 0 ? '#10b981' : '#ef4444' }}>
                    {d.scored.pts > 0 ? '+' : ''}{d.scored.pts}
                  </span>
                </div>
              ))}
              <div className="arena-comparison-total">Total: {totalScore} pts</div>
            </div>
            <div className="arena-comparison-divider">👻</div>
            <div className="arena-comparison-col ghost">
              <div className="arena-comparison-header">GHOST DECISIONS</div>
              {ghostDecisions.map((g, i) => (
                <div key={i} className="arena-comparison-row">
                  <span className="arena-comp-time">{formatTime(g.time || 0)}</span>
                  <span className="arena-comp-action ghost-action">{g.action?.toUpperCase()}</span>
                  <span className="arena-comp-pts ghost-pts">+{g.points}</span>
                </div>
              ))}
              <div className="arena-comparison-total ghost-total">Total: {ghostDecisions.reduce((s, g) => s + (g.points || 0), 0)} pts</div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="arena-patterns-wrap">
            {[
              { label: 'Panic Sells', count: decisions.filter(d => d.action === 'sell' && d.ghostAction === 'hold').length, color: '#ef4444', icon: '😨' },
              { label: 'Composed Holds', count: decisions.filter(d => d.action === 'hold').length, color: '#10b981', icon: '🧘' },
              { label: 'Smart Buys', count: decisions.filter(d => d.action === 'buy').length, color: '#3b82f6', icon: '📈' },
              { label: 'Rebalances', count: decisions.filter(d => d.action === 'rebalance').length, color: '#a855f7', icon: '⚖️' },
              { label: 'Missed Windows', count: decisions.filter(d => d.action === 'timeout').length, color: '#64748b', icon: '⏰' },
            ].map(p => (
              <div key={p.label} className="arena-pattern-card" style={{ borderColor: `${p.color}30` }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <span className="arena-pattern-count" style={{ color: p.color }}>{p.count}</span>
                <span className="arena-pattern-label">{p.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="arena-debrief-actions">
          <button className="arena-restart-btn" style={{ '--btn-color': modeColor }} onClick={onRestart}>
            ⚔ Play Again
          </button>
          <button className="arena-home-btn" onClick={onHome}>← Back to SimVesto</button>
        </div>
      </div>
    </div>
  );
}
