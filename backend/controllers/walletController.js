import Wallet from '../models/Wallet.js';
import Portfolio from '../models/Portfolio.js';

const TEMP_TEST_BALANCE = 100000;

const clearStalePortfolioForFreshWallet = async (userId, balance) => {
  const normalizedBalance = Number(balance || 0);
  if (normalizedBalance !== TEMP_TEST_BALANCE) return;

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio || !Array.isArray(portfolio.assets) || portfolio.assets.length === 0) return;

  portfolio.assets = [];
  await portfolio.save();
};

export const getWalletBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
    }

    await clearStalePortfolioForFreshWallet(req.user._id, wallet.balance);
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
      await clearStalePortfolioForFreshWallet(req.user._id, wallet.balance);
      return res.json({ balance: wallet.balance });
    }

    wallet.balance = TEMP_TEST_BALANCE;
    const updatedWallet = await wallet.save();
    await clearStalePortfolioForFreshWallet(req.user._id, updatedWallet.balance);
    res.json({ balance: updatedWallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
