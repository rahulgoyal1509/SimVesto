import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  input: {
    investment: { type: Number, required: true },
    assets: { type: Array, default: [] },
    duration: { type: Number, required: true },
  },
  result: {
    avgReturn: { type: Number, required: true },
    maxGain: { type: Number, required: true },
    maxLoss: { type: Number, required: true },
    probLoss: { type: Number, required: true },
  },
  samplePaths: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

export default mongoose.model('Simulation', simulationSchema);
