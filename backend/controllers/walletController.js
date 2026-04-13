import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import { getCoinLedgerEntries, recordCoinLedgerEntry } from '../utils/coinLedger.js';

const TEMP_TEST_BALANCE = 100000;

export const getWalletBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
    }

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
      return res.json({ balance: wallet.balance });
    }

    const balanceBefore = wallet.balance;
    wallet.balance = TEMP_TEST_BALANCE;
    const updatedWallet = await wallet.save();

    await recordCoinLedgerEntry({
      userId: req.user._id,
      sourceType: 'RESET',
      sourceId: `RESET:${Date.now()}`,
      label: 'Wallet reset',
      amount: round2(updatedWallet.balance - balanceBefore),
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      note: 'Wallet reset to starting balance',
    });

    res.json({ balance: updatedWallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const round2 = (value) => Number(Number(value || 0).toFixed(2));

export const getCoinLedger = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const entries = await getCoinLedgerEntries(req.user._id, limit);
    res.json({ count: entries.length, entries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const awardCoins = async (req, res) => {
  try {
    const amount = round2(req.body?.amount);
    const sourceId = String(req.body?.sourceId || '').trim();
    const label = String(req.body?.label || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid reward amount' });
    }

    if (!sourceId || !label) {
      return res.status(400).json({ message: 'Invalid reward metadata' });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id }) || await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
    const balanceBefore = wallet.balance;
    wallet.balance = round2(wallet.balance + amount);
    const updatedWallet = await wallet.save();

    const user = await User.findById(req.user._id);
    if (user) {
      user.iqCoins = updatedWallet.balance;
      await user.save();
    }

    const entry = await recordCoinLedgerEntry({
      userId: req.user._id,
      sourceType: 'ACHIEVEMENT',
      sourceId,
      label,
      amount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      referenceType: 'ACHIEVEMENT',
      referenceId: sourceId,
      note: req.body?.note || `Achievement reward: ${label}`,
    });

    res.json({ balance: updatedWallet.balance, entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
