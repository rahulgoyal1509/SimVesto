import Stock from '../models/Stock.js';
import yahooFinance from 'yahoo-finance2';

const yahooClient = new yahooFinance();
const SYMBOL_ALIASES = {
  IQTCS: 'TCS',
  IQREL: 'RELIANCE',
  IQHDFC: 'HDFCBANK',
  IQINFY: 'INFY',
  IQTAT: 'TATAMOTORS',
  IQSBI: 'SBIN',
  IQWIP: 'WIPRO',
  IQSUN: 'SUNPHARMA',
  IQAIR: 'BHARTIARTL',
  IQITC: 'ITC',
  IQADNI: 'ADANIPORTS',
  IQMRF: 'MRF',
  IQLTM: 'LTIM',
  IQDRR: 'DRREDDY',
  IQNTPC: 'NTPC',
  IQBAJ: 'BAJFINANCE',
  IQNEST: 'NESTLEIND',
  IQZOM: 'ZOMATO',
  IQPAY: 'PAYTM',
  IQCRYP: 'CRYPTO',
};

const normalizeFrontendSymbol = (symbol = '') => SYMBOL_ALIASES[symbol] || symbol;
// Using the stocks list from the frontend's mock to initialize backend cache
const MOCK_STOCKS = [
  { symbol: 'TCS', currentPrice: 3800 },
  { symbol: 'RELIANCE', currentPrice: 2450 },
  { symbol: 'HDFCBANK', currentPrice: 1650 },
  { symbol: 'INFY', currentPrice: 1500 },
  { symbol: 'TATAMOTORS', currentPrice: 950 },
  { symbol: 'SBIN', currentPrice: 780 },
  { symbol: 'WIPRO', currentPrice: 450 },
  { symbol: 'SUNPHARMA', currentPrice: 1200 },
  { symbol: 'BHARTIARTL', currentPrice: 1100 },
  { symbol: 'ITC', currentPrice: 420 },
  { symbol: 'ADANIPORTS', currentPrice: 1320 },
  { symbol: 'MRF', currentPrice: 12500 },
  { symbol: 'LTIM', currentPrice: 5200 },
  { symbol: 'DRREDDY', currentPrice: 5800 },
  { symbol: 'NTPC', currentPrice: 340 },
  { symbol: 'BAJFINANCE', currentPrice: 7200 },
  { symbol: 'NESTLEIND', currentPrice: 2400 },
  { symbol: 'ZOMATO', currentPrice: 185 },
  { symbol: 'PAYTM', currentPrice: 650 },
  { symbol: 'CRYPTO', currentPrice: 250 },
];

const MOCK_STOCK_MAP = MOCK_STOCKS.reduce((acc, s) => {
  acc[s.symbol] = s.currentPrice;
  return acc;
}, {});

export const FRONTEND_TO_YAHOO_SYMBOLS = {
  TCS: ['TCS.NS'],
  RELIANCE: ['RELIANCE.NS'],
  HDFCBANK: ['HDFCBANK.NS'],
  INFY: ['INFY.NS'],
  TATAMOTORS: ['TMCV.NS', 'TMCV.BO', 'TATAMOTORS.NS', 'TATAMTRDVR.NS'],
  SBIN: ['SBIN.NS'],
  WIPRO: ['WIPRO.NS'],
  SUNPHARMA: ['SUNPHARMA.NS'],
  BHARTIARTL: ['BHARTIARTL.NS'],
  ITC: ['ITC.NS'],
  ADANIPORTS: ['ADANIPORTS.NS'],
  MRF: ['MRF.NS'],
  LTIM: ['LTIM.NS'],
  DRREDDY: ['DRREDDY.NS'],
  NTPC: ['NTPC.NS'],
  BAJFINANCE: ['BAJFINANCE.NS'],
  NESTLEIND: ['NESTLEIND.NS'],
  ZOMATO: ['ZOMATO.NS', 'ETERNAL.NS'],
  PAYTM: ['PAYTM.NS'],
  CRYPTO: ['BTC-INR'],
};

const BACKEND_TO_FRONTEND = Object.entries(FRONTEND_TO_YAHOO_SYMBOLS).reduce((acc, [frontend, candidates]) => {
  candidates.forEach((ticker) => {
    acc[ticker] = frontend;
  });
  return acc;
}, {});

const normalizeQuote = (symbol, quote) => {
  const price = quote?.regularMarketPrice ?? quote?.postMarketPrice ?? quote?.preMarketPrice;
  const change = quote?.regularMarketChange ?? 0;
  const percent = quote?.regularMarketChangePercent ?? 0;

  if (price === null || price === undefined) {
    throw new Error(`No market price available for symbol ${symbol}`);
  }

  return {
    symbol,
    price: Number(Number(price).toFixed(2)),
    change: Number(Number(change).toFixed(2)),
    percent: Number(Number(percent).toFixed(2)),
  };
};

const fetchLiveByYahooTicker = async (yahooTicker) => {
  const quote = await yahooClient.quote(yahooTicker);
  return normalizeQuote(yahooTicker, quote);
};

export const fetchLiveByFrontendSymbol = async (frontendSymbol) => {
  const normalizedSymbol = normalizeFrontendSymbol(frontendSymbol);
  const candidates = FRONTEND_TO_YAHOO_SYMBOLS[normalizedSymbol] || [normalizedSymbol];
  let lastError = null;

  for (const ticker of candidates) {
    try {
      const live = await fetchLiveByYahooTicker(ticker);
      return {
        ...live,
        symbol: normalizedSymbol,
        sourceSymbol: ticker,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`No valid quote found for ${normalizedSymbol}`);
};

export const initializeStocks = async (req, res) => {
  try {
    for (const s of MOCK_STOCKS) {
      const exists = await Stock.findOne({ symbol: s.symbol });
      if (!exists) {
        await Stock.create(s);
      }
    }
    res.json({ message: 'Stocks initialized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStockBySymbol = async (req, res) => {
  try {
    const incoming = (req.params.symbol || '').toUpperCase();
    const normalized = normalizeFrontendSymbol(incoming);
    const stock = await Stock.findOne({ symbol: normalized }) || await Stock.findOne({ symbol: incoming });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveStocks = async (req, res) => {
  try {
    const symbols = Object.keys(FRONTEND_TO_YAHOO_SYMBOLS);
    const settled = await Promise.allSettled(symbols.map((symbol) => fetchLiveByFrontendSymbol(symbol)));
    const live = [];

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      const symbol = symbols[i];

      if (result.status === 'fulfilled') {
        live.push(result.value);
        continue;
      }

      const dbStock = await Stock.findOne({ symbol });
      if (dbStock) {
        live.push({
          symbol: dbStock.symbol,
          price: Number(Number(dbStock.currentPrice || 0).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-db',
        });
      } else if (MOCK_STOCK_MAP[symbol] !== undefined) {
        live.push({
          symbol,
          price: Number(Number(MOCK_STOCK_MAP[symbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        });
      }
    }

    if (live.length === 0) {
      const fallbackStocks = await Stock.find();
      const fallback = fallbackStocks.map((s) => ({
        symbol: s.symbol,
        price: Number(Number(s.currentPrice || 0).toFixed(2)),
        change: 0,
        percent: 0,
        sourceSymbol: 'fallback-db',
      }));
      if (fallback.length === 0) {
        const mockFallback = Object.keys(MOCK_STOCK_MAP).map((symbol) => ({
          symbol,
          price: Number(Number(MOCK_STOCK_MAP[symbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        }));
        return res.json(mockFallback);
      }
      return res.json(fallback);
    }

    res.json(live);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveStockBySymbol = async (req, res) => {
  try {
    const incoming = (req.params.symbol || '').toUpperCase();
    const frontendSymbol = normalizeFrontendSymbol(
      FRONTEND_TO_YAHOO_SYMBOLS[incoming]
        ? incoming
        : (BACKEND_TO_FRONTEND[incoming] || incoming)
    );

    try {
      const live = await fetchLiveByFrontendSymbol(frontendSymbol);
      return res.json(live);
    } catch (liveError) {
      const dbStock = await Stock.findOne({ symbol: frontendSymbol }) || await Stock.findOne({ symbol: incoming });
      if (dbStock) {
        return res.json({
          symbol: dbStock.symbol,
          price: Number(Number(dbStock.currentPrice || 0).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-db',
        });
      }

      if (MOCK_STOCK_MAP[frontendSymbol] !== undefined) {
        return res.json({
          symbol: frontendSymbol,
          price: Number(Number(MOCK_STOCK_MAP[frontendSymbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        });
      }
      throw liveError;
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Simulate live price updates
export const updatePricesRandomly = async () => {
    try {
        const stocks = await Stock.find();
        for (const stock of stocks) {
            // Random change between -2% and +2%
            const changePct = (Math.random() * 0.04) - 0.02;
            stock.currentPrice = stock.currentPrice * (1 + changePct);
            stock.lastUpdated = Date.now();
            await stock.save();
        }
    } catch(err) {
        console.error("Error updating prices", err);
    }
}
