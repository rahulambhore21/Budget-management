const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['Salary', 'Freelance', 'Investment', 'Business', 'Rental', 'Gift', 'Other'],
    required: true
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'],
    default: 'monthly'
  },
  taxable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Income', incomeSchema);
