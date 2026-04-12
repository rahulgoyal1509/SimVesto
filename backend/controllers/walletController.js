import Wallet from '../models/Wallet.js';

export const getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      res.json({ balance: wallet.balance });
    } else {
      res.status(404).json({ message: 'Wallet not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      wallet.balance = 100000;
      const updatedWallet = await wallet.save();
      res.json({ balance: updatedWallet.balance });
    } else {
      res.status(404).json({ message: 'Wallet not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
