import User from '../models/User.js';
import Behavior from '../models/Behavior.js';

const getFearClass = (score) => {
  if (score >= 67) return 'HIGH';
  if (score >= 34) return 'MEDIUM';
  return 'LOW';
};

export const getFearScore = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('fearScore fearClass');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      score: user.fearScore,
      classification: user.fearClass
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFearHistory = async (req, res) => {
  try {
    const history = await Behavior.find({ userId: req.user._id }).sort({ createdAt: 1 });
    // If no history exists, inject an initial point
    if (history.length === 0) {
      const user = await User.findById(req.user._id);
      return res.json([{
        timestamp: user.createdAt || Date.now(),
        score: user.fearScore,
        action: 'Initial Account Creation'
      }]);
    }

    const mappedHistory = history.map(h => ({
      timestamp: h.createdAt,
      score: h.scoreSnapshot,
      action: h.impactAction,
      delta: h.scoreDelta
    }));

    res.json(mappedHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logBehavior = async (req, res) => {
  try {
    const { action, hesitationMs, isPositiveOutcome } = req.body;
    const user = await User.findById(req.user._id);

    let scoreDelta = 0;
    
    // Algorithmic deduction according to spec
    if (action === 'SIMULATION_COMPLETED') {
        scoreDelta = -2; // Practice reduces fear
    } else if (action === 'TRADE_DECISION') {
        if (hesitationMs > 10000) {
            scoreDelta = +1; // Too much hesitation increases fear slightly
        } else if (hesitationMs < 3000) {
            scoreDelta = -1; // Fast decisions reduce fear
        }
        
        if (isPositiveOutcome !== undefined && !isPositiveOutcome) {
           scoreDelta = +2; // A loss might inject more fear
        }
    } else if (action === 'QUIZ_RESULT') {
        // Custom delta sent via body
        scoreDelta = req.body.delta || 0;
    }

    // Keep score bounded 0-100
    const originalScore = user.fearScore;
    let newScore = Math.max(0, Math.min(100, originalScore + scoreDelta));
    
    user.fearScore = newScore;
    user.fearClass = getFearClass(newScore);

    await user.save();

    if (scoreDelta !== 0) {
      await Behavior.create({
        userId: user._id,
        scoreSnapshot: newScore,
        classificationSnapshot: user.fearClass,
        impactAction: action,
        scoreDelta: scoreDelta
      });
    }

    res.json({
      score: user.fearScore,
      classification: user.fearClass,
      delta: scoreDelta,
      previousScore: originalScore
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPortfolioRecommendations = async (req, res) => {
  try {
    // Determine which portfolios to send based on fear class. 
    // Usually all 3 are returned, but perhaps highlighted.
    
    const portfolios = {
      HIGH: {
        title: 'Conservative Shield',
        risk: 'Low',
        expectedReturn: '4 - 6%',
        allocation: [{ asset: 'Bonds/FDs', pct: 70 }, { asset: 'Large Cap Stocks', pct: 30 }],
        description: 'Perfect for High Fear. Prioritizes capital protection.'
      },
      MEDIUM: {
        title: 'Balanced Growth',
        risk: 'Moderate',
        expectedReturn: '8 - 12%',
        allocation: [{ asset: 'Large Cap Stocks', pct: 60 }, { asset: 'Mid Cap Stocks', pct: 20 }, { asset: 'Bonds', pct: 20 }],
        description: 'For Medium Fear. Balances risk and reward.'
      },
      LOW: {
        title: 'Aggressive Alpha',
        risk: 'High',
        expectedReturn: '15%+',
        allocation: [{ asset: 'Small Cap Stocks', pct: 40 }, { asset: 'Mid Cap Stocks', pct: 40 }, { asset: 'Crypto/Alt', pct: 20 }],
        description: 'For Low Fear. Maximizes returns with high volatility.'
      }
    };

    res.json(portfolios);
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};
