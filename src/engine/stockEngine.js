// Stock Price Engine — Geometric Brownian Motion
// Creates realistic real-time stock price movement

const STOCKS = [
  { id: 1, symbol: 'TCS', name: 'TCS', sector: 'Technology', basePrice: 3800, volatility: 0.15, drift: 0.12, color: '#7c3aed' },
  { id: 2, symbol: 'RELIANCE', name: 'Reliance', sector: 'Energy', basePrice: 2450, volatility: 0.20, drift: 0.10, color: '#3b82f6' },
  { id: 3, symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Finance', basePrice: 1650, volatility: 0.12, drift: 0.08, color: '#10b981' },
  { id: 4, symbol: 'INFY', name: 'Infosys', sector: 'Technology', basePrice: 1500, volatility: 0.18, drift: 0.11, color: '#f59e0b' },
  { id: 5, symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', basePrice: 950, volatility: 0.25, drift: 0.13, color: '#ef4444' },
  { id: 6, symbol: 'SBIN', name: 'SBI', sector: 'Finance', basePrice: 780, volatility: 0.14, drift: 0.07, color: '#06b6d4' },
  { id: 7, symbol: 'WIPRO', name: 'Wipro', sector: 'Technology', basePrice: 450, volatility: 0.16, drift: 0.09, color: '#8b5cf6' },
  { id: 8, symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Healthcare', basePrice: 1200, volatility: 0.19, drift: 0.10, color: '#ec4899' },
  { id: 9, symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', basePrice: 1100, volatility: 0.13, drift: 0.09, color: '#14b8a6' },
  { id: 10, symbol: 'ITC', name: 'ITC', sector: 'FMCG', basePrice: 420, volatility: 0.10, drift: 0.06, color: '#f97316' },
  { id: 11, symbol: 'ADANIPORTS', name: 'Adani Ports', sector: 'Infrastructure', basePrice: 1320, volatility: 0.30, drift: 0.15, color: '#a855f7' },
  { id: 12, symbol: 'MRF', name: 'MRF', sector: 'Automobile', basePrice: 12500, volatility: 0.12, drift: 0.08, color: '#d946ef' },
  { id: 13, symbol: 'LTIM', name: 'L&T Mindtree', sector: 'Technology', basePrice: 5200, volatility: 0.22, drift: 0.14, color: '#0ea5e9' },
  { id: 14, symbol: 'DRREDDY', name: 'DR Reddy', sector: 'Healthcare', basePrice: 5800, volatility: 0.16, drift: 0.09, color: '#22d3ee' },
  { id: 15, symbol: 'NTPC', name: 'NTPC', sector: 'Energy', basePrice: 340, volatility: 0.11, drift: 0.07, color: '#84cc16' },
  { id: 16, symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', basePrice: 7200, volatility: 0.20, drift: 0.12, color: '#eab308' },
  { id: 17, symbol: 'NESTLEIND', name: 'Nestlé India', sector: 'FMCG', basePrice: 2400, volatility: 0.08, drift: 0.06, color: '#fb923c' },
  { id: 18, symbol: 'ZOMATO', name: 'Zomato', sector: 'Technology', basePrice: 185, volatility: 0.35, drift: 0.18, color: '#f43f5e' },
  { id: 19, symbol: 'PAYTM', name: 'Paytm', sector: 'Fintech', basePrice: 650, volatility: 0.40, drift: 0.05, color: '#2dd4bf' },
  { id: 20, symbol: 'CRYPTO', name: 'CryptoCoin', sector: 'Crypto', basePrice: 250, volatility: 0.80, drift: 0.45, color: '#fbbf24' },
];

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generatePriceHistory(stock, days = 30, pointsPerDay = 24) {
  const history = [];
  let price = stock.basePrice;
  const dt = 1 / 252 / pointsPerDay;
  const dailyDrift = stock.drift;
  const dailyVol = stock.volatility;

  for (let d = 0; d < days; d++) {
    for (let p = 0; p < pointsPerDay; p++) {
      const epsilon = gaussianRandom();
      const dS = price * (dailyDrift * dt + dailyVol * epsilon * Math.sqrt(dt));
      price = Math.max(price + dS, price * 0.5);

      const timestamp = Date.now() - (days - d) * 86400000 + p * (86400000 / pointsPerDay);
      history.push({
        time: timestamp,
        price: parseFloat(price.toFixed(2)),
        open: parseFloat((price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2)),
        high: parseFloat((price * (1 + Math.random() * 0.01)).toFixed(2)),
        low: parseFloat((price * (1 - Math.random() * 0.01)).toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000 + 100000),
      });
    }
  }
  return history;
}

function initializeStocks() {
  return STOCKS.map(stock => {
    const history = generatePriceHistory(stock);
    const currentPrice = history[history.length - 1].price;
    const prevDayPrice = history[history.length - 25]?.price || stock.basePrice;
    const dayChange = currentPrice - prevDayPrice;
    const dayChangePct = (dayChange / prevDayPrice) * 100;

    return {
      ...stock,
      currentPrice,
      previousPrice: currentPrice,
      dayOpen: history[history.length - 24]?.price || currentPrice,
      dayHigh: Math.max(...history.slice(-24).map(h => h.high)),
      dayLow: Math.min(...history.slice(-24).map(h => h.low)),
      dayChange: parseFloat(dayChange.toFixed(2)),
      dayChangePct: parseFloat(dayChangePct.toFixed(2)),
      priceHistory: history,
      lastUpdate: Date.now(),
    };
  });
}

function tickPrice(stock) {
  const dt = 1 / 252 / 24 / 60;
  const epsilon = gaussianRandom();
  const dS = stock.currentPrice * (stock.drift * dt + stock.volatility * epsilon * Math.sqrt(dt));
  const newPrice = Math.max(stock.currentPrice + dS, stock.currentPrice * 0.5);
  const rounded = parseFloat(newPrice.toFixed(2));

  const dayChange = rounded - stock.dayOpen;
  const dayChangePct = (dayChange / stock.dayOpen) * 100;

  const newPoint = {
    time: Date.now(),
    price: rounded,
    open: stock.currentPrice,
    high: Math.max(rounded, stock.currentPrice),
    low: Math.min(rounded, stock.currentPrice),
    close: rounded,
    volume: Math.floor(Math.random() * 50000 + 10000),
  };

  return {
    ...stock,
    previousPrice: stock.currentPrice,
    currentPrice: rounded,
    dayHigh: Math.max(stock.dayHigh, rounded),
    dayLow: Math.min(stock.dayLow, rounded),
    dayChange: parseFloat(dayChange.toFixed(2)),
    dayChangePct: parseFloat(dayChangePct.toFixed(2)),
    priceHistory: [...stock.priceHistory.slice(-720), newPoint],
    lastUpdate: Date.now(),
  };
}

export { STOCKS, initializeStocks, tickPrice, gaussianRandom, generatePriceHistory };
