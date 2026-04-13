import mongoose from 'mongoose';

const coinLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sourceType: {
    type: String,
    enum: ['TRADE', 'ACHIEVEMENT', 'RESET'],
    required: true,
  },
  sourceId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  referenceType: {
    type: String,
    default: null,
  },
  referenceId: {
    type: String,
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

coinLedgerSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('CoinLedger', coinLedgerSchema);