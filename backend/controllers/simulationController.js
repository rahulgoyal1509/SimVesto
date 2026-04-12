import Simulation from '../models/Simulation.js';
import Stock from '../models/Stock.js';

export const runSimulation = async (req, res) => {
  try {
    const { investment, assets, duration } = req.body;
    
    // Validate
    if (!investment || !duration || !assets || assets.length === 0) {
      return res.status(400).json({ message: 'Invalid input parameters' });
    }

    // Run Monte Carlo
    const NUM_SIMULATIONS = 200;
    const finalValues = [];

    // Pre-fetch all needed stock prices to avoid hitting DB in loop
    const stockMap = {};
    for (const asset of assets) {
      const dbStock = await Stock.findOne({ symbol: asset.symbol });
      stockMap[asset.symbol] = dbStock ? dbStock.currentPrice : 100;
    }

    // Simulation Loop
    for (let i = 0; i < NUM_SIMULATIONS; i++) {
      let simTotalEndValue = 0;

      for (const asset of assets) {
        let currentPrice = stockMap[asset.symbol];
        
        for (let day = 0; day < duration; day++) {
          // -2% to +2% daily change
          const dailyChange = (Math.random() * 0.04) - 0.02;
          currentPrice = currentPrice * (1 + dailyChange);
        }
        
        simTotalEndValue += currentPrice * asset.quantity;
      }
      // Add uninvested cash (investment - initial portfolio cost)
      // Assuming 'investment' represents total capital deployed to this sim
      // Wait, in this paradigm, let's assume investment is just the starting total value
      finalValues.push(simTotalEndValue);
    }

    // Calculate metrics
    finalValues.sort((a, b) => a - b);
    
    const maxGainRaw = finalValues[finalValues.length - 1] - investment;
    const maxLossRaw = investment - finalValues[0];
    
    const avgReturn = (finalValues.reduce((a, b) => a + b, 0) / NUM_SIMULATIONS) - investment;
    const maxGain = maxGainRaw > 0 ? maxGainRaw : 0;
    const maxLoss = maxLossRaw > 0 ? maxLossRaw : 0;
    
    const lossCount = finalValues.filter(val => val < investment).length;
    const probLoss = (lossCount / NUM_SIMULATIONS) * 100;

    const result = {
      avgReturn: parseFloat(avgReturn.toFixed(2)),
      maxGain: parseFloat(maxGain.toFixed(2)),
      maxLoss: parseFloat(maxLoss.toFixed(2)),
      probLoss: parseFloat(probLoss.toFixed(2)),
    };

    const simulation = await Simulation.create({
      userId: req.user._id,
      input: { investment, assets, duration },
      result,
      samplePaths: [] // not saving thick data
    });

    res.json(simulation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
