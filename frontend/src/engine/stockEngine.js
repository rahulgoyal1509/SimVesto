// Stock Price Engine — Geometric Brownian Motion
// Creates realistic real-time stock price movement

const STOCKS = [
  { id: 1,  symbol: 'TCS',        name: 'TCS',           sector: 'Technology',     basePrice: 3800,  volatility: 0.15, drift: 0.12, color: '#7c3aed', spreadFactor: 0.0010 },
  { id: 2,  symbol: 'RELIANCE',   name: 'Reliance',      sector: 'Energy',         basePrice: 2450,  volatility: 0.20, drift: 0.10, color: '#3b82f6', spreadFactor: 0.0012 },
  { id: 3,  symbol: 'HDFCBANK',   name: 'HDFC Bank',     sector: 'Finance',        basePrice: 1650,  volatility: 0.12, drift: 0.08, color: '#10b981', spreadFactor: 0.0009 },
  { id: 4,  symbol: 'INFY',       name: 'Infosys',       sector: 'Technology',     basePrice: 1500,  volatility: 0.18, drift: 0.11, color: '#f59e0b', spreadFactor: 0.0011 },
  { id: 5,  symbol: 'TATAMOTORS', name: 'Tata Motors',   sector: 'Automobile',     basePrice: 950,   volatility: 0.25, drift: 0.13, color: '#ef4444', spreadFactor: 0.0015 },
  { id: 6,  symbol: 'SBIN',       name: 'SBI',           sector: 'Finance',        basePrice: 780,   volatility: 0.14, drift: 0.07, color: '#06b6d4', spreadFactor: 0.0010 },
  { id: 7,  symbol: 'WIPRO',      name: 'Wipro',         sector: 'Technology',     basePrice: 450,   volatility: 0.16, drift: 0.09, color: '#8b5cf6', spreadFactor: 0.0010 },
  { id: 8,  symbol: 'SUNPHARMA',  name: 'Sun Pharma',    sector: 'Healthcare',     basePrice: 1200,  volatility: 0.19, drift: 0.10, color: '#ec4899', spreadFactor: 0.0012 },
  { id: 9,  symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom',        basePrice: 1100,  volatility: 0.13, drift: 0.09, color: '#14b8a6', spreadFactor: 0.0009 },
  { id: 10, symbol: 'ITC',        name: 'ITC',           sector: 'FMCG',           basePrice: 420,   volatility: 0.10, drift: 0.06, color: '#f97316', spreadFactor: 0.0008 },
  { id: 11, symbol: 'ADANIPORTS', name: 'Adani Ports',   sector: 'Infrastructure', basePrice: 1320,  volatility: 0.30, drift: 0.15, color: '#a855f7', spreadFactor: 0.0018 },
  { id: 12, symbol: 'MRF',        name: 'MRF',           sector: 'Automobile',     basePrice: 12500, volatility: 0.12, drift: 0.08, color: '#d946ef', spreadFactor: 0.0009 },
  { id: 13, symbol: 'LTIM',       name: 'L&T Mindtree',  sector: 'Technology',     basePrice: 5200,  volatility: 0.22, drift: 0.14, color: '#0ea5e9', spreadFactor: 0.0013 },
  { id: 14, symbol: 'DRREDDY',    name: 'DR Reddy',      sector: 'Healthcare',     basePrice: 5800,  volatility: 0.16, drift: 0.09, color: '#22d3ee', spreadFactor: 0.0010 },
  { id: 15, symbol: 'NTPC',       name: 'NTPC',          sector: 'Energy',         basePrice: 340,   volatility: 0.11, drift: 0.07, color: '#84cc16', spreadFactor: 0.0008 },
  { id: 16, symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance',        basePrice: 7200,  volatility: 0.20, drift: 0.12, color: '#eab308', spreadFactor: 0.0012 },
  { id: 17, symbol: 'NESTLEIND',  name: 'Nestlé India',  sector: 'FMCG',           basePrice: 2400,  volatility: 0.08, drift: 0.06, color: '#fb923c', spreadFactor: 0.0008 },
  { id: 18, symbol: 'ZOMATO',     name: 'Zomato',        sector: 'Technology',     basePrice: 185,   volatility: 0.35, drift: 0.18, color: '#f43f5e', spreadFactor: 0.0020 },
  { id: 19, symbol: 'PAYTM',      name: 'Paytm',         sector: 'Fintech',        basePrice: 650,   volatility: 0.40, drift: 0.05, color: '#2dd4bf', spreadFactor: 0.0025 },
  { id: 20, symbol: 'CRYPTO',     name: 'CryptoCoin',    sector: 'Crypto',         basePrice: 250,   volatility: 0.80, drift: 0.45, color: '#fbbf24', spreadFactor: 0.0050 },
];

const round2 = (v) => parseFloat(Number(v).toFixed(2));

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate price history using GBM.
 * History is scaled so the LAST point ends exactly at stock.basePrice.
 * This ensures stable prices across refreshes when basePrice is seeded from localStorage.
 */
function generatePriceHistory(stock, days = 365, pointsPerDay = 1) {
  const history = [];
  let price = stock.basePrice;
  const dt = 1 / 252 / pointsPerDay;
  const now = Date.now();

  for (let d = 0; d < days; d++) {
    for (let p = 0; p < pointsPerDay; p++) {
      const epsilon = gaussianRandom();
      const dS = price * (stock.drift * dt + stock.volatility * epsilon * Math.sqrt(dt));
      price = Math.max(price + dS, price * 0.5);

      const millisPerPoint = (86400000 / pointsPerDay);
      const timestamp = now - (days - d - 1) * 86400000 - (pointsPerDay - p - 1) * millisPerPoint;

      history.push({
        time: timestamp,
        price: parseFloat(price.toFixed(2)),
        open:  parseFloat((price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2)),
        high:  parseFloat((price * (1 + Math.random() * 0.01)).toFixed(2)),
        low:   parseFloat((price * (1 - Math.random() * 0.01)).toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000 + 100000),
      });
    }
  }

  history.sort((a, b) => a.time - b.time);

  // Scale entire history so last price = stock.basePrice (target price)
  const lastPrice = history[history.length - 1].price;
  if (lastPrice > 0 && Math.abs(lastPrice - stock.basePrice) > 0.01) {
    const scale = stock.basePrice / lastPrice;
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      history[i] = {
        ...h,
        price:  round2(h.price  * scale),
        open:   round2(h.open   * scale),
        high:   round2(h.high   * scale),
        low:    round2(h.low    * scale),
        close:  round2(h.close  * scale),
      };
    }
  }

  return history;
}

/**
 * Compute bid/ask prices based on current price and stock's spread factor.
 */
function computeSpread(price, spreadFactor) {
  const sf = spreadFactor || 0.001;
  return {
    buyPrice:  round2(price * (1 + sf)),
    sellPrice: round2(price * (1 - sf)),
    spread:    round2(price * sf * 2),
    spreadPct: parseFloat((sf * 2 * 100).toFixed(3)),
  };
}

/**
 * Initialize stocks. Accepts an optional seedPrices map { [symbol]: number }
 * so that on page refresh prices stay stable.
 */
function initializeStocks(seedPrices = {}) {
  return STOCKS.map(stock => {
    const seeded = seedPrices[stock.symbol];
    const targetPrice = (seeded && Number.isFinite(seeded) && seeded > 0)
      ? seeded
      : stock.basePrice;

    // Use targetPrice as basePrice so history ends exactly there
    const stockDef = { ...stock, basePrice: targetPrice };
    const history = generatePriceHistory(stockDef);
    const currentPrice = history[history.length - 1].price;
    const prevDayPrice = history[history.length - 25]?.price || targetPrice;
    const dayChange    = currentPrice - prevDayPrice;
    const dayChangePct = (dayChange / prevDayPrice) * 100;
    const { buyPrice, sellPrice, spread, spreadPct } = computeSpread(currentPrice, stock.spreadFactor);

    return {
      ...stock,
      currentPrice,
      buyPrice,
      sellPrice,
      spread,
      spreadPct,
      previousPrice:  currentPrice,
      dayOpen:        history[history.length - 24]?.price || currentPrice,
      dayHigh:        Math.max(...history.slice(-24).map(h => h.high)),
      dayLow:         Math.min(...history.slice(-24).map(h => h.low)),
      dayChange:      parseFloat(dayChange.toFixed(2)),
      dayChangePct:   parseFloat(dayChangePct.toFixed(2)),
      priceHistory:   history,
      lastUpdate:     Date.now(),
    };
  });
}

function tickPrice(stock) {
  const dt = 1 / 252 / 24 / 60;
  const epsilon = gaussianRandom();
  const dS = stock.currentPrice * (stock.drift * dt + stock.volatility * epsilon * Math.sqrt(dt));
  const newPrice = Math.max(stock.currentPrice + dS, stock.currentPrice * 0.5);
  const rounded  = parseFloat(newPrice.toFixed(2));

  const dayChange    = rounded - stock.dayOpen;
  const dayChangePct = (dayChange / stock.dayOpen) * 100;
  const { buyPrice, sellPrice, spread, spreadPct } = computeSpread(rounded, stock.spreadFactor);

  const newPoint = {
    time:   Date.now(),
    price:  rounded,
    open:   stock.currentPrice,
    high:   Math.max(rounded, stock.currentPrice),
    low:    Math.min(rounded, stock.currentPrice),
    close:  rounded,
    volume: Math.floor(Math.random() * 50000 + 10000),
  };

  return {
    ...stock,
    previousPrice:  stock.currentPrice,
    currentPrice:   rounded,
    buyPrice,
    sellPrice,
    spread,
    spreadPct,
    dayHigh:        Math.max(stock.dayHigh, rounded),
    dayLow:         Math.min(stock.dayLow, rounded),
    dayChange:      parseFloat(dayChange.toFixed(2)),
    dayChangePct:   parseFloat(dayChangePct.toFixed(2)),
    priceHistory:   [...stock.priceHistory.slice(-720), newPoint],
    lastUpdate:     Date.now(),
  };
}

export { STOCKS, initializeStocks, tickPrice, gaussianRandom, generatePriceHistory, computeSpread };
