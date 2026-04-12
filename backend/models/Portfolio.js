import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  assets: [{
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    avgBuyPrice: { type: Number, required: true, default: 0 },
  }],
}, { timestamps: true });

export default mongoose.model('Portfolio', portfolioSchema);
