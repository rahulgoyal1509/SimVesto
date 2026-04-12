import mongoose from 'mongoose';

const behaviorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scoreSnapshot: {
    type: Number,
    required: true,
  },
  classificationSnapshot: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    required: true,
  },
  impactAction: {
    type: String, // e.g., 'QUICK_TRADE', 'LONG_HESITATION', 'SIMULATION_COMPLETED'
    required: true,
  },
  scoreDelta: {
    type: Number, // Positive or negative
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Behavior', behaviorSchema);
