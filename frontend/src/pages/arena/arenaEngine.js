// ─── ARENA ENGINE ─────────────────────────────────────────────────────────────

// ── PERSONA DATA ──────────────────────────────────────────────────────────────
const PROFESSIONS = [
  { id: 'student', label: 'Student', panicThreshold: 2, city: ['Pune', 'Bangalore', 'Delhi', 'Hyderabad'] },
  { id: 'salaried', label: 'Salaried Employee', panicThreshold: 3.5, city: ['Mumbai', 'Gurgaon', 'Chennai', 'Noida'] },
  { id: 'entrepreneur', label: 'Entrepreneur', panicThreshold: 5, city: ['Ahmedabad', 'Bangalore', 'Mumbai', 'Surat'] },
  { id: 'retired_govt', label: 'Retired Government Officer', panicThreshold: 2.5, city: ['Lucknow', 'Jaipur', 'Bhopal', 'Patna'] },
  { id: 'startup_founder', label: 'Startup Founder', panicThreshold: 6, city: ['Bangalore', 'Hyderabad', 'Pune', 'Mumbai'] },
  { id: 'freelancer', label: 'Freelancer', panicThreshold: 4, city: ['Kolkata', 'Indore', 'Kochi', 'Chandigarh'] },
  { id: 'housewife', label: 'Housewife Investor', panicThreshold: 2, city: ['Surat', 'Nagpur', 'Coimbatore', 'Vadodara'] },
  { id: 'nri', label: 'NRI Investor', panicThreshold: 5, city: ['Dubai', 'Singapore', 'London', 'Toronto'] },
];

const PORTFOLIO_TYPES = [
  { id: 'small_sip', label: 'Small SIP', minVal: 15000, maxVal: 80000, holdings: ['HDFC Mid Cap', 'Axis Small Cap', 'SBI Blue Chip SIP'] },
  { id: 'midcap', label: 'Mid-Cap Heavy', minVal: 80000, maxVal: 300000, holdings: ['Infosys', 'Tata Motors', 'Zomato', 'HDFC Mid Cap Fund'] },
  { id: 'bluechip', label: 'Blue Chip Dominant', minVal: 200000, maxVal: 800000, holdings: ['Reliance', 'TCS', 'HDFC Bank', 'ITC'] },
  { id: 'crypto_mixed', label: 'Crypto-Mixed', minVal: 50000, maxVal: 250000, holdings: ['Bitcoin ETF', 'Ethereum Fund', 'Infosys', 'ICICI Bank'] },
  { id: 'real_estate', label: 'Real Estate Backed', minVal: 500000, maxVal: 2000000, holdings: ['DLF', 'Godrej Properties', 'HDFC Bank', 'SBI'] },
];

const DEPENDENCIES = [
  { id: 'breadwinner', label: 'Sole Breadwinner', pressureMultiplier: 1.8 },
  { id: 'secondary', label: 'Secondary Income', pressureMultiplier: 1.0 },
  { id: 'savings', label: 'Savings-Based Investor', pressureMultiplier: 1.4 },
];

const ARCHETYPES = [
  { id: 'anxious', label: 'Anxious Preservationist', trait: 'You hate losses more than you love gains. Every red tick feels personal.' },
  { id: 'aggressive', label: 'Aggressive Risk-Taker', trait: 'You live for volatility. Big swings excite you — sometimes dangerously so.' },
  { id: 'hesitant', label: 'Informed but Hesitant', trait: 'You know the data but second-guess every call. Knowledge and action rarely meet.' },
  { id: 'overconfident', label: 'Overconfident Newcomer', trait: 'Three months of gains made you feel invincible. The market has other plans.' },
];

const LIFE_STAGES = [
  { id: 'young_debt', label: 'Young with Debt', ageRange: [22, 28], emiPressure: true },
  { id: 'mid_stable', label: 'Mid-Career Stable', ageRange: [30, 42], emiPressure: false },
  { id: 'pre_retirement', label: 'Pre-Retirement', ageRange: [52, 60], emiPressure: false },
  { id: 'laid_off', label: 'Recently Laid Off', ageRange: [28, 45], emiPressure: true },
];

const SCENARIOS = [
  { id: 'rbi_hike', title: 'RBI Surprise Rate Hike', brief: 'The Reserve Bank of India announced an emergency 50bps rate hike citing inflation fears. Equity markets reacted sharply — banking and rate-sensitive sectors leading the fall. Bond yields spiked. FIIs began pulling out.', trigger: 'rate', affectedSectors: ['Banking', 'Real Estate', 'Auto'] },
  { id: 'tech_selloff', title: 'Global Tech Sell-Off', brief: 'US Fed signals higher-for-longer rates. NASDAQ dropped 4.2% overnight. Domestic IT stocks opened gap-down. FII selling intensified. Mid-cap tech names under heavy pressure.', trigger: 'tech', affectedSectors: ['IT', 'Technology', 'Software'] },
  { id: 'geopolitical', title: 'Geopolitical Escalation', brief: 'Tensions in a key oil-producing region have spiked overnight. Crude futures surged 8%. INR weakened against USD. Aviation, paint, and FMCG sectors under pressure. Defense stocks bucked the trend.', trigger: 'geo', affectedSectors: ['Aviation', 'FMCG', 'Auto'] },
  { id: 'fii_exit', title: 'FII Mass Exodus', brief: 'Foreign institutional investors pulled ₹12,400 crore from Indian equities in a single session — the largest outflow in 18 months. Broad-based selling with small and mid-caps hit hardest.', trigger: 'fii', affectedSectors: ['Small Cap', 'Mid Cap', 'Banking'] },
  { id: 'earnings_miss', title: 'Q2 Earnings Season Shock', brief: 'Multiple Nifty 50 heavyweights missed Q2 estimates. Analysts cut targets across the board. Retail sentiment turned sharply negative. Options market pricing in continued downside.', trigger: 'earnings', affectedSectors: ['Banking', 'IT', 'Auto'] },
];

const NEWS_POOL = [
  { text: 'HDFC Bank Q2 results miss estimates — stock down 3.8% in pre-market', sector: 'Banking', impact: -3.8 },
  { text: 'IT sector sell-off intensifies amid US recession fears', sector: 'IT', impact: -4.2 },
  { text: 'RBI holds rates steady — analysts divided on next move', sector: 'Banking', impact: 1.2 },
  { text: 'Reliance Industries beats revenue estimates, stock up 2.1%', sector: 'Energy', impact: 2.1 },
  { text: 'FII net sellers for 8th consecutive session — ₹4,200 Cr outflow today', sector: 'Broad', impact: -2.5 },
  { text: 'Mid-cap index tumbles 6% — panic selling in small caps', sector: 'Mid Cap', impact: -6.0 },
  { text: 'Nifty50 enters correction territory — down 10% from peak', sector: 'Broad', impact: -4.5 },
  { text: 'Infosys slashes FY guidance citing weak deal pipeline', sector: 'IT', impact: -5.1 },
  { text: 'Zomato reports first ever quarterly profit — stock surges 9%', sector: 'Tech', impact: 9.0 },
  { text: 'SBI net NPA rises unexpectedly — stock falls 4.3%', sector: 'Banking', impact: -4.3 },
  { text: 'Tata Motors EV numbers disappoint — JLR outlook revised down', sector: 'Auto', impact: -3.6 },
  { text: 'DLF wins major commercial project — stock up 5%', sector: 'Real Estate', impact: 5.0 },
  { text: 'US CPI hotter than expected — global markets under pressure', sector: 'Broad', impact: -3.2 },
  { text: 'Crude oil spikes 7% — downstream companies hit hard', sector: 'FMCG', impact: -2.8 },
  { text: 'ITC cigarette volumes beat estimates — stock gains 3%', sector: 'FMCG', impact: 3.0 },
];

// ── RANDOM UTILS ───────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function fmtCr(n) { return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`; }

// ── PERSONA GENERATOR ─────────────────────────────────────────────────────────
export function generatePersona(difficulty) {
  const prof = pick(PROFESSIONS);
  const port = pick(PORTFOLIO_TYPES);
  const dep = pick(DEPENDENCIES);
  const arch = pick(ARCHETYPES);
  const stage = pick(LIFE_STAGES);
  const city = pick(prof.city);
  const age = randInt(stage.ageRange[0], stage.ageRange[1]);
  const portValue = randInt(port.minVal, port.maxVal);
  const scenario = pick(SCENARIOS);

  // Scale panic threshold by difficulty
  const diffMult = { turbulence: 1.2, storm: 1.0, blackout: 0.8 }[difficulty] || 1.0;
  const panicThreshold = prof.panicThreshold * dep.pressureMultiplier * diffMult;

  // Generate character sketch
  const emiLine = stage.emiPressure ? ` Your EMI is due in ${randInt(3, 14)} days and this portfolio is your safety net.` : '';
  const breadwinnerLine = dep.id === 'breadwinner' ? ' Your family depends on your income — losses aren\'t just numbers, they\'re real consequences.' : '';

  const sketch = buildSketch(prof, port, arch, stage, city, age, portValue, emiLine, breadwinnerLine);

  // Generate portfolio holdings
  const holdings = generatePortfolioHoldings(port, portValue);

  // Background timeline
  const timeline = generateTimeline(prof, port, age, portValue);

  return {
    id: `${prof.id}_${port.id}_${arch.id}_${Date.now()}`,
    profession: prof.label,
    professionId: prof.id,
    portfolioType: port.label,
    dependency: dep.label,
    archetype: arch.label,
    archetypeId: arch.id,
    lifestage: stage.label,
    city,
    age,
    portValue,
    panicThreshold,
    sketch,
    holdings,
    timeline,
    scenario,
    archetypeTrait: arch.trait,
    hasEmi: stage.emiPressure,
    isBreadwinner: dep.id === 'breadwinner',
  };
}

function buildSketch(prof, port, arch, stage, city, age, portValue, emiLine, breadwinnerLine) {
  const templates = [
    `You're a ${age}-year-old ${prof.label.toLowerCase()} from ${city} with ${fmtCr(portValue)} invested in ${port.label.toLowerCase()} funds.${emiLine}${breadwinnerLine} ${arch.trait} Remember: panic is your worst enemy here — stay thoughtful.`,
    `Meet yourself: ${age}, ${prof.label.toLowerCase()}, ${city}. You built ${fmtCr(portValue)} carefully over the years — mostly in ${port.label.toLowerCase()} assets.${emiLine}${breadwinnerLine} ${arch.trait}`,
    `${age} years old, ${prof.label.toLowerCase()}, ${city}. Your portfolio of ${fmtCr(portValue)} in ${port.label.toLowerCase()} represents ${stage.label.toLowerCase()} savings.${breadwinnerLine}${emiLine} ${arch.trait} The market doesn't care about your situation — but you should.`,
  ];
  return pick(templates);
}

function generatePortfolioHoldings(port, totalValue) {
  const stockNames = port.holdings;
  const n = stockNames.length;
  let remaining = totalValue;
  return stockNames.map((name, i) => {
    const isLast = i === n - 1;
    const pct = isLast ? 1 : rand(0.15, 0.45);
    const value = isLast ? remaining : Math.round(totalValue * pct);
    remaining -= value;
    const price = randInt(100, 3500);
    const qty = Math.max(1, Math.round(value / price));
    const dayChange = parseFloat((rand(-5, 5)).toFixed(2));
    return { name, price, qty, value: price * qty, dayChange, allocation: Math.round((price * qty / totalValue) * 100) };
  });
}

function generateTimeline(prof, port, age, portValue) {
  const startAge = Math.max(18, age - randInt(3, 8));
  const events = [
    { year: startAge, event: `Started first ${port.id === 'small_sip' ? 'SIP of ₹500/month' : 'investment with a small lump sum'}` },
    { year: startAge + 1, event: 'Survived first market correction. Didn\'t panic. Portfolio recovered.' },
    { year: age - 1, event: `Increased allocation to ${port.label.toLowerCase()}. Portfolio crossed ${fmtCr(portValue * 0.7)}.` },
    { year: age, event: `Today: ${fmtCr(portValue)} invested. Confidence built. But the market always has one more test.` },
  ];
  return events;
}

// ── GBM PRICE SIMULATION ──────────────────────────────────────────────────────
export function runGBMStep(prices, difficulty, scenario) {
  const params = {
    turbulence: { mu: -0.0002, sigma: 0.008 },
    storm:      { mu: -0.0004, sigma: 0.018 },
    blackout:   { mu: -0.0008, sigma: 0.035 },
  }[difficulty] || { mu: 0, sigma: 0.01 };

  // Add scenario-based bias
  const bias = scenario?.trigger === 'tech' ? -0.001 : scenario?.trigger === 'rate' ? -0.0008 : 0;

  return prices.map(p => {
    const dt = 1;
    const z = boxMullerRandom();
    const newPrice = p * Math.exp((params.mu + bias - 0.5 * params.sigma ** 2) * dt + params.sigma * Math.sqrt(dt) * z);
    return Math.max(newPrice, p * 0.5); // floor at 50% to avoid collapse
  });
}

function boxMullerRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── NEWS GENERATOR ────────────────────────────────────────────────────────────
export function generateNewsEvent(persona, elapsed, usedIndices) {
  const available = NEWS_POOL.filter((_, i) => !usedIndices.has(i));
  if (available.length === 0) return null;
  // Weight toward persona's affected sectors
  const scenarioSectors = persona.scenario.affectedSectors;
  const weighted = available.map((n, i) => ({
    ...n,
    origIdx: NEWS_POOL.indexOf(n),
    weight: scenarioSectors.some(s => n.sector.includes(s)) ? 3 : 1,
  }));
  const totalWeight = weighted.reduce((sum, n) => sum + n.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of weighted) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return weighted[0];
}

// ── SENTIMENT ENGINE ──────────────────────────────────────────────────────────
export function computeSentiment(priceChangePct, difficulty) {
  const thresholds = {
    turbulence: { panic: -4, fear: -2, neutral: 1, bullish: 3 },
    storm:      { panic: -6, fear: -3, neutral: 0.5, bullish: 2 },
    blackout:   { panic: -10, fear: -5, neutral: 0, bullish: 1 },
  }[difficulty] || { panic: -4, fear: -2, neutral: 1, bullish: 3 };

  if (priceChangePct <= thresholds.panic) return { label: 'PANIC ZONE', color: '#ff1a1a', bg: 'rgba(255,26,26,0.15)' };
  if (priceChangePct <= thresholds.fear)  return { label: 'FEARFUL', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
  if (priceChangePct <= thresholds.neutral) return { label: 'NEUTRAL', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  if (priceChangePct <= thresholds.bullish) return { label: 'CAUTIOUS', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
  return { label: 'BULLISH', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
}

// ── GHOST PORTFOLIO ENGINE ────────────────────────────────────────────────────
export function ghostPortfolioDecide(event, persona, currentDrawdownPct, cashPct) {
  const { panicThreshold } = persona;

  // Ghost never panic-sells on first event
  if (currentDrawdownPct > 12) return { action: 'sell', reason: 'Stop-loss triggered at >12% drawdown', points: 10 };
  if (currentDrawdownPct > panicThreshold * 2 && cashPct > 20) return { action: 'rebalance', reason: 'Rebalanced — drawdown exceeded threshold, had cash buffer', points: 15 };
  if (event && event.impact > 5) return { action: 'buy', reason: 'Bought the dip — positive catalyst identified', points: 20 };
  if (Math.abs(currentDrawdownPct) < panicThreshold) return { action: 'hold', reason: 'Held — drawdown within persona\'s risk tolerance', points: 15 };
  return { action: 'hold', reason: 'Held — noise vs signal ratio favors patience', points: 12 };
}

// ── SCORING ───────────────────────────────────────────────────────────────────
export function scoreDecision(userAction, ghostAction, drawdownPct, persona, timeLeft) {
  const tags = [];
  let pts = 0;

  if (userAction === 'hold' && ghostAction.action === 'hold') {
    pts += 15; tags.push({ label: 'Held well under pressure', type: 'good' });
  } else if (userAction === 'sell' && ghostAction.action === 'hold') {
    pts -= 20; tags.push({ label: 'Panic sold too early', type: 'bad' });
  } else if (userAction === 'sell' && ghostAction.action === 'sell') {
    pts += 8; tags.push({ label: 'Timely exit', type: 'neutral' });
  } else if (userAction === 'buy' && ghostAction.action === 'buy') {
    pts += 20; tags.push({ label: 'Smart buy the dip', type: 'good' });
  } else if (userAction === 'buy' && drawdownPct < -5) {
    pts += 10; tags.push({ label: 'Contrarian buy — brave move', type: 'good' });
  } else if (userAction === 'rebalance') {
    pts += 10; tags.push({ label: 'Proactive rebalance', type: 'good' });
  } else if (userAction === 'timeout') {
    pts -= 5; tags.push({ label: 'Missed decision window', type: 'bad' });
  }

  // Speed bonus
  if (timeLeft > 10 && userAction !== 'timeout') {
    pts += 3; tags.push({ label: 'Quick thinker', type: 'neutral' });
  }

  return { pts, tags };
}

// ── AI COACH MESSAGES ─────────────────────────────────────────────────────────
const COACH_MESSAGES = {
  turbulence: {
    hold: [
      "Take a breath. This pattern has recovered before.",
      "Your persona's goal is long-term — short-term noise doesn't define your outcome.",
      "Volatility is the price of returns. Stay the course.",
      "The best investors are often the most boring ones. Hold.",
    ],
    fear: [
      "This drop is within normal range. Don't let fear make your decision.",
      "Check your investment horizon. Does this change your thesis?",
      "FIIs are selling — but retail panic often marks the bottom.",
    ],
    panic: [
      "⚠️ Red alert — but selling now locks in the loss. Think.",
      "Every crash in history has recovered. This moment feels permanent. It isn't.",
      "Your persona can't afford to panic right now. Breathe and reassess.",
    ],
    decision: [
      "A significant move just happened. What does your gut say? Now check your strategy.",
      "News is out. Give yourself 5 seconds before deciding. Ready?",
      "Big moment. Remember: your persona's goal drives the decision, not fear.",
    ],
  },
  storm: {
    hold: ["Stay disciplined.", "Pattern recognition: this looks like distribution phase.", "Hold or lose the opportunity."],
    fear: ["Drawdown approaching threshold. Watch carefully.", "Sector rotation underway — context matters."],
    panic: ["Extreme fear. Classic capitulation setup.", "Risk/reward is shifting. Act deliberately."],
    decision: ["Your move.", "Decide fast. Clock is running.", "What's your read on this?"],
  },
  blackout: {
    hold: [], fear: [], panic: [], decision: [],
  },
};

export function getCoachMessage(difficulty, type) {
  const pool = COACH_MESSAGES[difficulty]?.[type] || [];
  if (pool.length === 0) return null;
  return pick(pool);
}

// ── AFFIRMATION POOL ──────────────────────────────────────────────────────────
export const AFFIRMATIONS = [
  "Take a breath. This pattern has recovered before.",
  "Your persona's goal is long-term — short-term noise doesn't define your outcome.",
  "The market tests patience before rewarding it.",
  "Every expert was once a beginner. Trust the process.",
  "Volatility ≠ loss. Only selling makes it real.",
  "This exact setup has happened before. Study the pattern.",
  "Fear is loudest at the bottom. Don't let it win.",
  "Your best trades are the ones you didn't make in panic.",
];

export function getAffirmation() { return pick(AFFIRMATIONS); }
