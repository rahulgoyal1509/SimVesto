/**
 * Behavioral Counterparty Matching Engine
 * Connects traders based on opposing emotional states:
 *   Panicked Sellers  ←→  Confident Buyers
 *   FOMO Buyers       ←→  Calm Profit-Takers
 *
 * When a match is found, both parties get a slightly better execution price
 * than the market bid/ask — rewarding rational trading behaviour.
 */

// ── Simulated counterparty profiles ──────────────────────────────────────────

const SELLER_PROFILES = [
  { name: 'Arjun M.',    avatar: '😰', archetype: 'Panic Seller',     fearScore: 88, tagline: 'Selling before it gets worse…', color: '#ef4444' },
  { name: 'Sneha K.',    avatar: '😨', archetype: 'Stress Liquidator', fearScore: 79, tagline: 'Can\'t take the volatility anymore', color: '#f97316' },
  { name: 'Rahul V.',    avatar: '🥴', archetype: 'Loss-Averse Seller',fearScore: 73, tagline: 'Cut losses and move on', color: '#f59e0b' },
  { name: 'Deepa S.',    avatar: '😟', archetype: 'Momentum Chaser',   fearScore: 68, tagline: 'Following the crowd down', color: '#eab308' },
  { name: 'Vikram N.',   avatar: '😣', archetype: 'Overreactor',       fearScore: 82, tagline: 'News spooked me into selling', color: '#ef4444' },
  { name: 'Anita R.',    avatar: '😫', archetype: 'Herd Seller',       fearScore: 76, tagline: 'Everyone else is selling...', color: '#f97316' },
];

const BUYER_PROFILES = [
  { name: 'Kiran P.',    avatar: '🧠', archetype: 'Value Accumulator',  fearScore: 22, tagline: 'Buying the dip, long-term vision', color: '#10b981' },
  { name: 'Meera J.',    avatar: '📊', archetype: 'Systematic Buyer',   fearScore: 18, tagline: 'Dollar-cost averaging consistently', color: '#10b981' },
  { name: 'Suresh L.',   avatar: '🎯', archetype: 'Contrarian Investor',fearScore: 30, tagline: 'Greedy when others are fearful', color: '#14b8a6' },
  { name: 'Pooja A.',    avatar: '💎', archetype: 'Diamond Hands',      fearScore: 15, tagline: 'Holding conviction through volatility', color: '#06b6d4' },
  { name: 'Rohan G.',    avatar: '🦁', archetype: 'Fearless Trader',    fearScore: 28, tagline: 'Market chaos = opportunity', color: '#8b5cf6' },
  { name: 'Lakshmi T.',  avatar: '📈', archetype: 'Growth Hunter',      fearScore: 35, tagline: 'Long-term compounders only', color: '#10b981' },
];

// ── Match probability model ───────────────────────────────────────────────────

/**
 * Compute probability of finding a counterparty match.
 *
 * Rules:
 *  • BUY order: you're the buyer → look for panic sellers (high fear score)
 *    Match probability ↑ when your fear score is LOW (confident buy in panic market)
 *  • SELL order: you're the seller → look for FOMO buyers (low fear score)
 *    Match probability ↑ when your fear score is HIGH (selling into strength)
 *
 * This rewards emotionally-intelligent trading.
 */
function computeMatchProbability(side, userFearScore, stockVolatility = 0.2) {
  let base = 0.30; // 30% base chance

  // Volatility increases matching activity
  base += stockVolatility * 0.15; // up to +12% for high-vol stocks

  if (side === 'BUY') {
    // Confident buyers (low fear) are more likely to match with panicked sellers
    if (userFearScore <= 30) base += 0.30;
    else if (userFearScore <= 50) base += 0.15;
    else if (userFearScore >= 75) base -= 0.10; // FOMO buyer less likely
  } else {
    // Rational sellers (high fear = panic, but also rational profit-takers)
    if (userFearScore >= 70) base += 0.25; // panic seller matches easily
    else if (userFearScore >= 50) base += 0.10;
    else if (userFearScore <= 25) base += 0.20; // calm profit-taker also matches
  }

  return Math.min(Math.max(base, 0.05), 0.85);
}

/**
 * Price improvement when matched vs market bid/ask.
 * Expressed as fraction of price (e.g., 0.003 = 0.3% better).
 * More volatile stocks have bigger improvements.
 */
function computePriceImprovement(stockVolatility = 0.2, userFearScore = 50, side = 'BUY') {
  // Base improvement: 0.10% to 0.35%
  let improvement = 0.001 + stockVolatility * 0.0015;

  // Rational traders get better prices as a reward
  if (side === 'BUY' && userFearScore <= 30) improvement += 0.0015;
  if (side === 'SELL' && userFearScore >= 70) improvement += 0.001; // panic sellers still match

  return Math.min(improvement, 0.006); // cap at 0.6%
}

// ── Insight generator ─────────────────────────────────────────────────────────

function generateInsight(counterparty, side, priceImprovementPct) {
  const savings = priceImprovementPct.toFixed(2);

  if (side === 'BUY') {
    const insights = [
      `${counterparty.name} was selling out of fear — you bought rationally and saved ${savings}%.`,
      `While ${counterparty.name} panicked, your steady conviction got you a ${savings}% price advantage.`,
      `${counterparty.name}'s ${counterparty.archetype.toLowerCase()} behavior created an opportunity — you saved ${savings}%.`,
      `Fear in the market is your friend. ${counterparty.name} sold low, you bought smart (${savings}% better than ask).`,
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  } else {
    const insights = [
      `${counterparty.name} was eager to buy — your disciplined exit netted ${savings}% above bid.`,
      `You sold into strength while ${counterparty.name} chased momentum — ${savings}% better execution.`,
      `${counterparty.name}'s confidence matched your discipline — you got ${savings}% above market bid.`,
      `Smart timing: ${counterparty.name} absorbed your position at ${savings}% premium over bid price.`,
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }
}

// ── Main matching function ────────────────────────────────────────────────────

/**
 * Attempt to find a counterparty match for a trade.
 *
 * @param {Object} params
 * @param {string} params.symbol          - Stock symbol
 * @param {string} params.side            - 'BUY' or 'SELL'
 * @param {number} params.userFearScore   - 0–100
 * @param {number} params.stockVolatility - Stock's volatility coefficient
 * @param {number} params.currentPrice    - Current market price
 * @param {number} params.buyPrice        - Current ask price
 * @param {number} params.sellPrice       - Current bid price
 * @returns {Object|null} Match result or null if no match
 */
export function findCounterpartyMatch({
  symbol,
  side,
  userFearScore = 50,
  stockVolatility = 0.2,
  currentPrice,
  buyPrice,
  sellPrice,
}) {
  const probability = computeMatchProbability(side, userFearScore, stockVolatility);

  if (Math.random() > probability) return null;

  const pool = side === 'BUY' ? SELLER_PROFILES : BUYER_PROFILES;
  const counterparty = pool[Math.floor(Math.random() * pool.length)];

  const improvementFraction = computePriceImprovement(stockVolatility, userFearScore, side);
  const priceImprovementPct = parseFloat((improvementFraction * 100).toFixed(3));

  // Matched execution price:
  // BUY → we pay less than ask (between mid and ask)
  // SELL → we receive more than bid (between bid and mid)
  let matchedPrice;
  if (side === 'BUY') {
    matchedPrice = parseFloat((buyPrice * (1 - improvementFraction)).toFixed(2));
  } else {
    matchedPrice = parseFloat((sellPrice * (1 + improvementFraction)).toFixed(2));
  }

  const savingsPerShare = parseFloat(Math.abs(
    side === 'BUY' ? buyPrice - matchedPrice : matchedPrice - sellPrice
  ).toFixed(2));

  const matchType = side === 'BUY'
    ? (counterparty.fearScore >= 70 ? 'PANIC_SELLER_MATCH' : 'MOTIVATED_SELLER_MATCH')
    : (counterparty.fearScore <= 35 ? 'CONFIDENT_BUYER_MATCH' : 'MOTIVATED_BUYER_MATCH');

  const insight = generateInsight(counterparty, side, priceImprovementPct);

  return {
    matched: true,
    counterparty,
    matchType,
    matchedPrice,
    priceImprovementPct,
    savingsPerShare,
    insight,
    symbol,
    side,
    matchedAt: Date.now(),
  };
}

/**
 * Get a human-readable label for the match type.
 */
export function getMatchTypeLabel(matchType) {
  const labels = {
    PANIC_SELLER_MATCH:     '🔥 Panic Seller Matched',
    MOTIVATED_SELLER_MATCH: '📉 Motivated Seller Matched',
    CONFIDENT_BUYER_MATCH:  '💎 Confident Buyer Matched',
    MOTIVATED_BUYER_MATCH:  '📈 Motivated Buyer Matched',
  };
  return labels[matchType] || '🤝 Counterparty Matched';
}

/**
 * Get color for match type badge.
 */
export function getMatchTypeColor(matchType) {
  const colors = {
    PANIC_SELLER_MATCH:     '#ef4444',
    MOTIVATED_SELLER_MATCH: '#f97316',
    CONFIDENT_BUYER_MATCH:  '#10b981',
    MOTIVATED_BUYER_MATCH:  '#06b6d4',
  };
  return colors[matchType] || '#8b5cf6';
}
