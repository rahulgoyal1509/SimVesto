import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fearScore: {
    type: Number,
    default: 80, // Default to a more hesitant state natively
  },
  fearClass: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH',
  },
  literacyScore: {
    type: Number,
    default: 5,
  },
  milestones: {
    type: Array,
    default: [],
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
