import Portfolio from '../models/Portfolio.js';
import Stock from '../models/Stock.js';

export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Calculate current value dynamically
    let totalValue = 0;
    const enrichedAssets = [];

    for (const asset of portfolio.assets) {
      const stock = await Stock.findOne({ symbol: asset.symbol });
      const currentPrice = stock ? stock.currentPrice : 0;
      const currentValue = currentPrice * asset.quantity;
      totalValue += currentValue;
      
      enrichedAssets.push({
        ...asset.toObject(),
        currentPrice,
        currentValue,
        returnPct: asset.avgBuyPrice > 0 ? ((currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100 : 0
      });
    }

    res.json({ 
      assets: enrichedAssets,
      totalValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
