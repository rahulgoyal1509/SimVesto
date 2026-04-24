import { useEffect, useRef, useState, useCallback } from 'react';
import { runGBMStep, generateNewsEvent, ghostPortfolioDecide, getCoachMessage, getAffirmation, computeSentiment } from './arenaEngine';
import SentimentTicker from './SentimentTicker';
import AICoach from './AICoach';
import NewsPopup from './NewsPopup';
import DecisionOverlay from './DecisionOverlay';
import InactivityHints from './InactivityHints';
import AffirmationToast from './AffirmationToast';
import ParticleField from './ParticleField';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TICK_INTERVALS = { turbulence: 2000, storm: 1500, blackout: 1000 };
const NEWS_INTERVAL_MIN = 25000;
const NEWS_INTERVAL_RANGE = 15000;
const SESSION_DURATION = 5 * 60 * 1000; // 5 min

export default function SimulationWorkspace({ difficulty, persona, onEnd }) {
  const [prices, setPrices] = useState(() => persona.holdings.map(h => h.price));
  const [priceHistory, setPriceHistory] = useState(() => [{ t: 0, value: persona.holdings.reduce((s, h) => s + h.price * h.qty, 0) }]);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionNews, setDecisionNews] = useState(null);
  const [coachMessage, setCoachMessage] = useState('');
  const [affirmation, setAffirmation] = useState({ msg: '', id: 0 });
  const [inactiveSeconds, setInactiveSeconds] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [ghostDecisions, setGhostDecisions] = useState([]);
  const [usedNewsIdx] = useState(() => new Set());
  const [drawdownPct, setDrawdownPct] = useState(0);
  const [personaPanelOpen, setPersonaPanelOpen] = useState(true);

  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const inactiveRef = useRef(0);
  const initialPortValue = useRef(persona.holdings.reduce((s, h) => s + h.price * h.qty, 0));

  // Sync paused ref
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Master clock
  useEffect(() => {
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
      inactiveRef.current += 1;
      setInactiveSeconds(s => s + 1);
      if (elapsedRef.current * 1000 >= SESSION_DURATION) onEnd(buildSessionData());
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // GBM price tick
  useEffect(() => {
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      setPrices(prev => {
        const next = runGBMStep(prev, difficulty, persona.scenario);
        const totalVal = next.reduce((s, p, i) => s + p * persona.holdings[i].qty, 0);
        const dd = ((totalVal - initialPortValue.current) / initialPortValue.current) * 100;
        setDrawdownPct(dd);
        setPriceHistory(hist => [...hist.slice(-60), { t: elapsedRef.current, value: Math.round(totalVal) }]);
        return next;
      });
    }, TICK_INTERVALS[difficulty] || 2000);
    return () => clearInterval(iv);
  }, [difficulty]);

  // News events
  useEffect(() => {
    const scheduleNews = () => {
      const delay = NEWS_INTERVAL_MIN + Math.random() * NEWS_INTERVAL_RANGE;
      return setTimeout(() => {
        if (pausedRef.current) { scheduleNews(); return; }
        const news = generateNewsEvent(persona, elapsedRef.current, usedNewsIdx);
        if (news) {
          usedNewsIdx.add(news.origIdx);
          setCurrentNews(news);
          triggerDecisionMoment(news);
        }
        scheduleNews();
      }, delay);
    };
    const t = scheduleNews();
    return () => clearTimeout(t);
  }, []);

  // Affirmations (only non-blackout)
  useEffect(() => {
    if (difficulty === 'blackout') return;
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      setAffirmation({ msg: getAffirmation(), id: Date.now() });
    }, 30000);
    return () => clearInterval(iv);
  }, [difficulty]);

  // Coach messages
  useEffect(() => {
    if (difficulty === 'blackout') return;
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      const type = drawdownPct < -4 ? 'panic' : drawdownPct < -1.5 ? 'fear' : 'hold';
      const msg = getCoachMessage(difficulty, type);
      if (msg) setCoachMessage(msg);
    }, 20000);
    return () => clearInterval(iv);
  }, [difficulty, drawdownPct]);

  const triggerDecisionMoment = (news) => {
    if (Math.abs(news.impact) < 2.5) return; // only significant events
    setDecisionNews(news);
    setShowDecision(true);
    setPaused(false); // simulation continues but overlay shows
  };

  const handleDecide = useCallback((decisionData) => {
    setShowDecision(false);
    inactiveRef.current = 0;
    setInactiveSeconds(0);
    const currentDrawdown = drawdownPct;
    const totalVal = prices.reduce((s, p, i) => s + p * persona.holdings[i].qty, 0);
    const cashPct = 20; // simulated
    const ghost = ghostPortfolioDecide(decisionNews, persona, currentDrawdown, cashPct);
    const decisionRecord = {
      time: elapsedRef.current,
      action: decisionData.action,
      news: decisionNews?.text,
      drawdown: currentDrawdown,
      ghostAction: ghost.action,
      ghostReason: ghost.reason,
      portfolioValue: totalVal,
      timeLeft: decisionData.timeLeft,
      emotionalInput: decisionData.emotionalInput,
    };
    setDecisions(prev => [...prev, decisionRecord]);
    setGhostDecisions(prev => [...prev, { ...ghost, time: elapsedRef.current, news: decisionNews?.text }]);

    // Coach response to decision
    if (difficulty !== 'blackout') {
      const coachResponse = decisionData.action === 'sell' && ghost.action === 'hold'
        ? "You sold — Ghost investor held. Was this fear or strategy? We'll review in debrief."
        : decisionData.action === 'hold'
          ? "Good hold. The Ghost agrees — patience is the edge here."
          : "Decision logged. Keep watching the signals.";
      setCoachMessage(coachResponse);
    }
  }, [drawdownPct, prices, decisionNews, difficulty, persona]);

  const handleTimeout = useCallback(() => {
    setShowDecision(false);
    const totalVal = prices.reduce((s, p, i) => s + p * persona.holdings[i].qty, 0);
    const ghost = ghostPortfolioDecide(decisionNews, persona, drawdownPct, 20);
    setDecisions(prev => [...prev, { time: elapsedRef.current, action: 'timeout', news: decisionNews?.text, drawdown: drawdownPct, ghostAction: ghost.action, ghostReason: ghost.reason, portfolioValue: totalVal }]);
    setGhostDecisions(prev => [...prev, { ...ghost, time: elapsedRef.current }]);
  }, [drawdownPct, prices, decisionNews, persona]);

  const buildSessionData = () => ({
    difficulty,
    persona,
    decisions,
    ghostDecisions,
    priceHistory,
    finalValue: prices.reduce((s, p, i) => s + p * persona.holdings[i].qty, 0),
    initialValue: initialPortValue.current,
    duration: elapsedRef.current,
  });

  const handleEnd = () => onEnd(buildSessionData());

  const currentPortValue = prices.reduce((s, p, i) => s + p * persona.holdings[i].qty, 0);
  const sentiment = computeSentiment(drawdownPct, difficulty);
  const modeColor = { turbulence: '#10b981', storm: '#f59e0b', blackout: '#6366f1' }[difficulty];
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="arena-workspace" onMouseMove={() => { inactiveRef.current = 0; setInactiveSeconds(0); }}>
      <ParticleField intensity={0.5} />

      {/* Sentiment Ticker */}
      <SentimentTicker priceChangePct={drawdownPct} difficulty={difficulty} />

      {/* Main layout */}
      <div className="arena-workspace-layout">
        {/* LEFT: Simulation panels */}
        <div className="arena-sim-left">
          {/* Wallet / Net Worth */}
          <div className="arena-wallet-bar">
            <div className="arena-wallet-item">
              <span className="arena-wallet-label">NET WORTH</span>
              <span className="arena-wallet-value" style={{ color: drawdownPct >= 0 ? '#10b981' : '#ef4444' }}>
                ₹{Math.round(currentPortValue).toLocaleString()}
              </span>
            </div>
            <div className="arena-wallet-item">
              <span className="arena-wallet-label">P&L</span>
              <span className={`arena-wallet-pnl ${drawdownPct >= 0 ? 'up' : 'down'}`}>
                {drawdownPct >= 0 ? '▲' : '▼'} {Math.abs(drawdownPct).toFixed(2)}%
              </span>
            </div>
            <div className="arena-wallet-item">
              <span className="arena-wallet-label">SESSION</span>
              <span className="arena-wallet-timer">{formatTime(elapsed)}</span>
            </div>
            <div className="arena-wallet-controls">
              <button className="arena-ctrl-btn" onClick={() => setPaused(p => !p)} title={paused ? 'Resume' : 'Pause'}>
                {paused ? '▶' : '⏸'}
              </button>
              <button className="arena-ctrl-btn end" onClick={handleEnd} title="End Session">⏹ End</button>
            </div>
            {paused && <div className="arena-paused-badge">⏸ PAUSED</div>}
          </div>

          {/* Chart */}
          <div className="arena-chart-card">
            <div className="arena-chart-label">Portfolio Value — Live</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="arenaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={drawdownPct >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={drawdownPct >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
                  formatter={v => [`₹${v.toLocaleString()}`, 'Portfolio']}
                />
                <Area
                  type="monotone" dataKey="value"
                  stroke={drawdownPct >= 0 ? '#10b981' : '#ef4444'}
                  strokeWidth={2.5} fill="url(#arenaGrad)"
                  dot={false} animationDuration={300}
                  style={{ filter: `drop-shadow(0 0 6px ${drawdownPct >= 0 ? '#10b981' : '#ef4444'})` }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings */}
          <div className="arena-holdings-card">
            <div className="arena-holdings-label">Live Holdings</div>
            <div className="arena-holdings-list">
              {persona.holdings.map((h, i) => {
                const currentPrice = prices[i] || h.price;
                const pnlPct = ((currentPrice - h.price) / h.price) * 100;
                return (
                  <div key={i} className="arena-holding-row">
                    <div>
                      <div className="arena-holding-name">{h.name}</div>
                      <div className="arena-holding-qty">{h.qty} units</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="arena-holding-price">₹{Math.round(currentPrice).toLocaleString()}</div>
                      <div className={`arena-holding-pnl ${pnlPct >= 0 ? 'up' : 'down'}`}>
                        {pnlPct >= 0 ? '▲' : '▼'}{Math.abs(pnlPct).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: AI Coach + Persona panel */}
        <div className="arena-sim-right">
          <AICoach difficulty={difficulty} message={coachMessage} isDecisionMoment={showDecision} />

          {/* Persona sidebar */}
          <div className={`arena-persona-sidebar ${personaPanelOpen ? 'open' : ''}`}>
            <button className="arena-persona-toggle" onClick={() => setPersonaPanelOpen(p => !p)}>
              {personaPanelOpen ? '→' : '←'} Persona
            </button>
            {personaPanelOpen && (
              <div className="arena-persona-content">
                <div className="arena-persona-sidebar-name">{persona.profession}</div>
                <div className="arena-persona-sidebar-city">{persona.city} · Age {persona.age}</div>
                <p className="arena-persona-sidebar-sketch">{persona.sketch}</p>
                <div className="arena-persona-sidebar-trait">{persona.archetypeTrait}</div>
                <div className="arena-persona-sidebar-scenario">
                  <span style={{ color: modeColor, fontWeight: 700, fontSize: 11 }}>ACTIVE SCENARIO</span>
                  <div style={{ color: '#e2e8f0', fontSize: 12, marginTop: 4 }}>{persona.scenario.title}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inactivity hints */}
      <InactivityHints inactiveSeconds={inactiveSeconds} difficulty={difficulty} drawdownPct={drawdownPct} />

      {/* Affirmation */}
      <AffirmationToast message={affirmation.msg} id={affirmation.id} />

      {/* News popup */}
      {currentNews && <NewsPopup news={currentNews} onDismiss={() => setCurrentNews(null)} />}

      {/* Decision overlay */}
      {showDecision && (
        <DecisionOverlay
          news={decisionNews}
          persona={persona}
          difficulty={difficulty}
          onDecide={handleDecide}
          onTimeout={handleTimeout}
        />
      )}
    </div>
  );
}
