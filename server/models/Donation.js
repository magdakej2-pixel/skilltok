const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true }, // in pence (e.g. 300 = £3)
    currency: { type: String, default: 'gbp' },
    coffeeCount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    stripeSessionId: { type: String },
    anonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

donationSchema.index({ teacherId: 1, status: 1 });

module.exports = mongoose.model('Donation', donationSchema);
