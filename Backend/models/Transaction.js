const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Investment', 'Other'],
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Net Banking'],
    required: true
  },
  upiId: String,
  gstRate: Number,
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate GST before saving
transactionSchema.pre('save', function(next) {
  const gstRates = {
    'Food': 5,
    'Transport': 12,
    'Shopping': 18,
    'Bills': 0,
    'Investment': 0,
    'Other': 18
  };
  this.gstRate = gstRates[this.category];
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);