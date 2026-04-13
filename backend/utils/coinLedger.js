import CoinLedger from '../models/CoinLedger.js';

const round2 = (value) => Number(Number(value || 0).toFixed(2));

export const recordCoinLedgerEntry = async ({
  userId,
  sourceType,
  sourceId,
  label,
  amount,
  balanceBefore,
  balanceAfter,
  referenceType = null,
  referenceId = null,
  note = '',
  session = null,
}) => {
  const entry = {
    userId,
    sourceType,
    sourceId,
    label,
    amount: round2(amount),
    balanceBefore: round2(balanceBefore),
    balanceAfter: round2(balanceAfter),
    referenceType,
    referenceId,
    note,
  };

  const created = session
    ? await CoinLedger.create([entry], { session })
    : await CoinLedger.create(entry);

  return Array.isArray(created) ? created[0] : created;
};

export const getCoinLedgerEntries = async (userId, limit = 200) => {
  return CoinLedger.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};