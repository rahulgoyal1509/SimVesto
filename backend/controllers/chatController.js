import Stock from '../models/Stock.js';
import Portfolio from '../models/Portfolio.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function trimHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(item => item && typeof item.role === 'string' && typeof item.content === 'string')
    .slice(-8)
    .map(item => ({ role: item.role, content: item.content.slice(0, 400) }));
}

function classifyIntent(message) {
  const text = message.toLowerCase();
  if (/^(hi|hii|hello|hey|yo|hola|sup|good\s*(morning|afternoon|evening))\b/.test(text.trim())) return 'greeting';
  if (/\b(buy|sell|entry|exit|target|stop[- ]?loss|trade)\b/.test(text)) return 'trade';
  if (/\b(portfolio|holdings|diversif|allocation|rebalance)\b/.test(text)) return 'portfolio';
  if (/\b(risk|volatile|drawdown|loss|safe|fear)\b/.test(text)) return 'risk';
  if (/\b(beginner|learn|how|what is|explain|basics?)\b/.test(text)) return 'education';
  return 'general';
}

function buildMarketSnapshot(stocks) {
  const sorted = [...stocks].sort((a, b) => b.currentPrice - a.currentPrice);
  const topByPrice = sorted.slice(0, 5).map(s => `${s.symbol}: INR ${Number(s.currentPrice || 0).toFixed(2)}`);

  return {
    topByPrice,
    listedCount: stocks.length,
  };
}

function portfolioSummary(portfolio, stocks, wallet) {
  const stockMap = new Map(stocks.map(s => [s.symbol, Number(s.currentPrice || 0)]));
  const assets = portfolio?.assets || [];

  let holdingsValue = 0;
  const lines = assets.slice(0, 8).map(asset => {
    const current = stockMap.get(asset.symbol) || asset.avgBuyPrice || 0;
    const qty = Number(asset.quantity || 0);
    const avg = Number(asset.avgBuyPrice || 0);
    const value = qty * current;
    const cost = qty * avg;
    const pnlPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
    holdingsValue += value;
    return `${asset.symbol}: qty ${qty}, avg INR ${avg.toFixed(2)}, now INR ${current.toFixed(2)}, pnl ${pnlPct.toFixed(2)}%`;
  });

  const cash = Number(wallet?.balance || 0);
  const netWorth = holdingsValue + cash;

  return {
    holdingsValue,
    cash,
    netWorth,
    lines,
  };
}

function sanitizeSnapshotAssets(snapshot = []) {
  if (!Array.isArray(snapshot)) return null;
  return snapshot
    .filter(item => item && typeof item.symbol === 'string')
    .map(item => ({
      symbol: item.symbol.toUpperCase(),
      quantity: Number(item.quantity || 0),
      avgBuyPrice: Number(item.avgBuyPrice || 0),
    }))
    .filter(item => Number.isFinite(item.quantity) && item.quantity > 0);
}

function buildOrderSummary(transactions = []) {
  const safe = Array.isArray(transactions) ? transactions : [];
  const recent = safe.slice(0, 10).map(tx => ({
    type: tx.type,
    symbol: tx.symbol,
    quantity: Number(tx.quantity || 0),
    price: Number(tx.price || 0),
    totalAmount: Number(tx.totalAmount || 0),
    realizedPnl: Number(tx.realizedPnl || 0),
    timestamp: tx.timestamp,
  }));

  const stats = safe.reduce((acc, tx) => {
    const pnl = Number(tx.realizedPnl || 0);
    if (tx.type === 'BUY') acc.buyCount += 1;
    if (tx.type === 'SELL') acc.sellCount += 1;
    if (tx.type === 'SELL' && pnl > 0) acc.profitableSells += 1;
    if (tx.type === 'SELL' && pnl < 0) acc.lossSells += 1;
    acc.realizedPnl += pnl;
    return acc;
  }, {
    buyCount: 0,
    sellCount: 0,
    profitableSells: 0,
    lossSells: 0,
    realizedPnl: 0,
  });

  return {
    recent,
    totalOrders: safe.length,
    ...stats,
  };
}

function formatRecentOrdersBlock(orders) {
  if (!orders || !Array.isArray(orders.recent) || orders.recent.length === 0) return '';

  const lines = orders.recent.slice(0, 3).map((tx) => {
    const side = tx.type === 'BUY' ? 'BUY' : 'SELL';
    const qty = Number(tx.quantity || 0).toFixed(2).replace(/\.00$/, '');
    const price = Number(tx.price || 0).toFixed(2);
    const amount = Number(tx.totalAmount || 0).toFixed(2);
    const pnl = Number(tx.realizedPnl || 0);

    if (side === 'SELL') {
      const sign = pnl >= 0 ? '+' : '';
      return `- ${side} ${tx.symbol} | qty ${qty} @ INR ${price} | amount INR ${amount} | realized PnL ${sign}${pnl.toFixed(2)}`;
    }

    return `- ${side} ${tx.symbol} | qty ${qty} @ INR ${price} | amount INR ${amount}`;
  });

  return `Recent orders:\n${lines.join('\n')}`;
}

function attachRecentOrders(reply, orders) {
  const text = String(reply || '').trim();
  const block = formatRecentOrdersBlock(orders);
  if (!block) return text;
  if (/Recent orders:/i.test(text)) return text;

  const disclaimer = 'Educational use only.';
  if (text.endsWith(disclaimer)) {
    const base = text.slice(0, -disclaimer.length).trim();
    return `${base}\n\n${block}\n\n${disclaimer}`;
  }

  return `${text}\n\n${block}`;
}

function shouldAttachOrders(message = '', intent = 'general') {
  const text = String(message).toLowerCase();
  const asksForHistory = /\b(order|orders|history|trade history|past trades|recent trades|my trades|performance|pnl|profit|loss)\b/.test(text);
  if (asksForHistory) return true;

  // Keep responses clean unless user is explicitly asking about prior activity.
  return false;
}

function fallbackAdvice({ intent, message, user, market, portfolio, orders }) {
  if (intent === 'greeting') {
    return 'Hi. I can help with stock market basics, portfolio diversification, risk control, and investment planning. Ask me a specific question and I will keep it practical. Educational use only.';
  }

  const lowFear = user?.fearClass === 'LOW';
  const opening = lowFear
    ? 'Here is a data-first view based on your current profile.'
    : 'Here is a cautious, simple view based on your current profile.';

  const diversificationLine = portfolio.lines.length >= 4
    ? 'Your holdings are fairly spread; keep position sizing disciplined.'
    : 'Consider spreading risk across more than 4 symbols to reduce concentration.';

  const intentLineMap = {
    trade: 'For any trade, prefer entries in small tranches and define stop-loss before execution.',
    portfolio: diversificationLine,
    risk: 'Focus on max-loss control first: cap single-position risk and avoid averaging losers aggressively.',
    education: 'Start with trend, valuation, and risk-reward basics before short-term speculation.',
    general: 'Use a watchlist, thesis, and risk rule for every decision to avoid emotional trades.',
  };

  const hasPortfolioData = portfolio.lines.length > 0;
  const marketLine = market.topByPrice.length > 0
    ? `Market sample: ${market.topByPrice.slice(0, 3).join(' | ')}.`
    : '';
  const portfolioLine = hasPortfolioData
    ? `Your net worth in simulation is around INR ${portfolio.netWorth.toFixed(2)} with cash INR ${portfolio.cash.toFixed(2)}.`
    : 'I do not see holdings in your simulated portfolio yet; start small and diversify early.';
  const orderLine = orders.totalOrders > 0
    ? `Recent order history: ${orders.totalOrders} orders (${orders.buyCount} buys, ${orders.sellCount} sells), realized PnL INR ${orders.realizedPnl.toFixed(2)}.`
    : 'I do not see any order history yet. Start with small sized trades and track outcomes.';

  return [
    opening,
    `Question: "${message.slice(0, 160)}".`,
    intentLineMap[intent] || intentLineMap.general,
    intent === 'trade' || intent === 'portfolio' || intent === 'risk' ? marketLine : '',
    portfolioLine,
    orderLine,
    'Next step: share your risk level and time horizon, and I can suggest an allocation template.',
    'Educational use only.'
  ].filter(Boolean).join(' ');
}

function cleanReply(reply = '') {
  return String(reply)
    .replace(/This is educational guidance, not guaranteed financial advice\.?/gi, 'Educational use only.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function generateWithGroq({ apiKey, model, message, intent, user, history, market, portfolio, orders }) {
  const systemPrompt = [
    'You are SimVesto Copilot, a stock market education and investment guidance chatbot.',
    'Rules:',
    '1) Be clear, practical, and concise (max 170 words).',
    '2) Do not promise returns. Mention uncertainty.',
    '3) Tailor tone to fear class: HIGH -> cautious/simple, MEDIUM -> balanced, LOW -> data-first.',
    '4) Include one actionable next step.',
    '5) You can explain basics: diversification, risk, valuation, SIP, long-term plans, and glossary terms.',
    '6) If user asks for recommendations, provide options with pros/cons and risk notes.',
    '7) Never fabricate exact prices, PE ratios, 52-week ranges, dividends, or news. Use only numbers present in context JSON.',
    '8) For greetings like hi/hello, reply naturally in 1-2 short lines and ask what the user wants help with.',
    '9) Avoid repetitive phrases like "Given your high fear score" in every response.',
    '10) Prefer this structure when relevant: Summary, Why, Next step.',
    '11) End with: "Educational use only."'
  ].join('\n');

  const userContext = {
    fearScore: user?.fearScore ?? 80,
    fearClass: user?.fearClass ?? 'HIGH',
    literacyScore: user?.literacyScore ?? 5,
    intent,
    market,
    portfolio,
    orders,
    history,
    message,
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(item => ({ role: item.role, content: item.content })),
    {
      role: 'user',
      content: `Context JSON:\n${JSON.stringify(userContext)}\n\nCurrent user query:\n${message}`,
    },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 320,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return cleanReply(data?.choices?.[0]?.message?.content || '');
}

export const chatWithAdvisor = async (req, res) => {
  try {
    const message = (req.body?.message || '').trim();
    const history = trimHistory(req.body?.history);

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const [stocks, portfolio, wallet, transactions] = await Promise.all([
      Stock.find().limit(30),
      Portfolio.findOne({ userId: req.user._id }),
      Wallet.findOne({ userId: req.user._id }),
      Transaction.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(40).lean(),
    ]);

    const snapshotAssets = sanitizeSnapshotAssets(req.body?.holdingsSnapshot);
    const effectivePortfolio = snapshotAssets ? { assets: snapshotAssets } : portfolio;

    if (!snapshotAssets && Number(wallet?.balance || 0) === 100000 && Array.isArray(portfolio?.assets) && portfolio.assets.length > 0) {
      portfolio.assets = [];
      await portfolio.save();
    }

    const market = buildMarketSnapshot(stocks || []);
    const portfolioInfo = portfolioSummary(effectivePortfolio, stocks || [], wallet);
    const orderInfo = buildOrderSummary(transactions || []);
    const intent = classifyIntent(message);

    const apiKey = process.env.GROQ_API_KEY || '';
    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    let reply = '';

    if (apiKey) {
      try {
        reply = await generateWithGroq({
          apiKey,
          model: groqModel,
          message,
          intent,
          user: req.user,
          history,
          market,
          portfolio: portfolioInfo,
          orders: orderInfo,
        });
      } catch (err) {
        console.error('Groq chat failed, using fallback:', err.message);
      }
    }

    if (!reply) {
      reply = fallbackAdvice({
        intent,
        message,
        user: req.user,
        market,
        portfolio: portfolioInfo,
        orders: orderInfo,
      });
    }

    reply = cleanReply(reply);
    if (shouldAttachOrders(message, intent)) {
      reply = attachRecentOrders(reply, orderInfo);
    }

    res.json({
      reply,
      meta: {
        intent,
        fearClass: req.user?.fearClass || 'HIGH',
        usedModel: Boolean(apiKey) ? `${groqModel}-or-fallback` : 'rule-based-fallback',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to process chat.' });
  }
};
