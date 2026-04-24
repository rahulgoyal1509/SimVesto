// Fear Score Engine — Automatic behavioral analysis
// Captures user interactions silently and computes a fear score

const WEIGHTS = {
  avgDecisionTime: 0.20,
  sellHesitation: 0.15,
  lossCheckFrequency: 0.15,
  quizFearAnswers: 0.20,
  sessionCount: -0.10,      // Negative = more sessions reduce fear
  tradeFrequency: -0.10,
  profitTrades: -0.10,
};

export function computeFearScore(behaviorData) {
  const {
    avgDecisionTime = 5,
    sellHesitation = 3,
    lossCheckFrequency = 5,
    quizFearAnswers = 2,
    sessionCount = 1,
    tradeFrequency = 0,
    profitTradeRatio = 0.5,
  } = behaviorData;

  // Normalize each factor to 0-100
  const normDecision = Math.min(avgDecisionTime / 10, 1) * 100;
  const normHesitation = Math.min(sellHesitation / 8, 1) * 100;
  const normLossCheck = Math.min(lossCheckFrequency / 10, 1) * 100;
  const normQuiz = (quizFearAnswers / 3) * 100;
  const normSessions = Math.max(0, 100 - sessionCount * 10);
  const normTradeFreq = Math.max(0, 100 - tradeFrequency * 5);
  const normProfit = Math.max(0, 100 - profitTradeRatio * 100);

  let score =
    normDecision * Math.abs(WEIGHTS.avgDecisionTime) +
    normHesitation * Math.abs(WEIGHTS.sellHesitation) +
    normLossCheck * Math.abs(WEIGHTS.lossCheckFrequency) +
    normQuiz * Math.abs(WEIGHTS.quizFearAnswers) +
    normSessions * Math.abs(WEIGHTS.sessionCount) +
    normTradeFreq * Math.abs(WEIGHTS.tradeFrequency) +
    normProfit * Math.abs(WEIGHTS.profitTrades);

  score = Math.max(0, Math.min(100, Math.round(score)));

  let fearClass;
  if (score >= 65) fearClass = 'HIGH';
  else if (score >= 35) fearClass = 'MEDIUM';
  else fearClass = 'LOW';

  return { score, fearClass, confidence: Math.min(95, 50 + Math.abs(score - 50)) };
}

export function getFearColor(score) {
  if (score >= 65) return '#ef4444';
  if (score >= 35) return '#f59e0b';
  return '#10b981';
}

export function getFearLabel(fearClass) {
  switch (fearClass) {
    case 'HIGH': return 'Cautious Investor';
    case 'MEDIUM': return 'Balanced Explorer';
    case 'LOW': return 'Confident Trader';
    default: return 'New Investor';
  }
}

// Behavior tracker — attaches listeners automatically
export class BehaviorTracker {
  constructor(onUpdate) {
    this.events = [];
    this.hoverStart = {};
    this.onUpdate = onUpdate;
    this.sessionStart = Date.now();
  }

  trackHoverStart(elementId) {
    this.hoverStart[elementId] = Date.now();
  }

  trackHoverEnd(elementId) {
    if (this.hoverStart[elementId]) {
      const duration = Date.now() - this.hoverStart[elementId];
      this.events.push({
        type: 'hover_delay',
        elementId,
        duration,
        timestamp: Date.now(),
      });
      delete this.hoverStart[elementId];
    }
  }

  trackClick(elementId, context = '') {
    this.events.push({
      type: 'click',
      elementId,
      context,
      timestamp: Date.now(),
    });
  }

  trackPageView(page) {
    this.events.push({
      type: 'page_view',
      elementId: page,
      timestamp: Date.now(),
    });
  }

  trackTradeHesitation(durationMs) {
    this.events.push({
      type: 'trade_hesitation',
      duration: durationMs,
      timestamp: Date.now(),
    });
  }

  getMetrics() {
    const hoverEvents = this.events.filter(e => e.type === 'hover_delay');
    const avgDecisionTime = hoverEvents.length > 0
      ? hoverEvents.reduce((s, e) => s + e.duration, 0) / hoverEvents.length / 1000
      : 5;

    const hesitationEvents = this.events.filter(e => e.type === 'trade_hesitation');
    const sellHesitation = hesitationEvents.length > 0
      ? hesitationEvents.reduce((s, e) => s + e.duration, 0) / hesitationEvents.length / 1000
      : 3;

    const holdingsChecks = this.events.filter(e => e.type === 'page_view' && e.elementId === '/holdings').length;

    return {
      avgDecisionTime,
      sellHesitation,
      lossCheckFrequency: holdingsChecks,
      eventCount: this.events.length,
      sessionDuration: (Date.now() - this.sessionStart) / 1000,
    };
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}
