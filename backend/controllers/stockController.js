import Stock from '../models/Stock.js';
// Using the stocks list from the frontend's mock to initialize backend cache
const MOCK_STOCKS = [
  { symbol: 'IQTCS', currentPrice: 3800 },
  { symbol: 'IQREL', currentPrice: 2450 },
  { symbol: 'IQHDFC', currentPrice: 1650 },
  { symbol: 'IQINFY', currentPrice: 1500 },
  { symbol: 'IQTAT', currentPrice: 950 },
  { symbol: 'IQSBI', currentPrice: 780 },
  { symbol: 'IQWIP', currentPrice: 450 },
  { symbol: 'IQSUN', currentPrice: 1200 },
  { symbol: 'IQAIR', currentPrice: 1100 },
  { symbol: 'IQITC', currentPrice: 420 },
  { symbol: 'IQADNI', currentPrice: 1320 },
  { symbol: 'IQMRF', currentPrice: 12500 },
  { symbol: 'IQLTM', currentPrice: 5200 },
  { symbol: 'IQDRR', currentPrice: 5800 },
  { symbol: 'IQNTPC', currentPrice: 340 },
  { symbol: 'IQBAJ', currentPrice: 7200 },
  { symbol: 'IQNEST', currentPrice: 2400 },
  { symbol: 'IQZOM', currentPrice: 185 },
  { symbol: 'IQPAY', currentPrice: 650 },
  { symbol: 'IQCRYP', currentPrice: 250 },
];

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
    const stock = await Stock.findOne({ symbol: req.params.symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
