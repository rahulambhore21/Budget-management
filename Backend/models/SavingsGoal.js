const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 1
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Emergency Fund', 'Vacation', 'Education', 'Home', 'Vehicle', 'Retirement', 'Other'],
    default: 'Other'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate progress percentage
savingsGoalSchema.virtual('progressPercentage').get(function() {
  return (this.currentAmount / this.targetAmount) * 100;
});

// Check if target date has passed
savingsGoalSchema.virtual('isPastDue').get(function() {
  return !this.isCompleted && new Date() > this.targetDate;
});

// Calculate required monthly savings
savingsGoalSchema.virtual('requiredMonthlySavings').get(function() {
  const today = new Date();
  const targetDate = new Date(this.targetDate);
  
  // If target date is in the past, return remaining amount
  if (today > targetDate) {
    return this.targetAmount - this.currentAmount;
  }
  
  // Calculate months remaining
  const monthsRemaining = 
    (targetDate.getFullYear() - today.getFullYear()) * 12 + 
    (targetDate.getMonth() - today.getMonth());
  
  // Calculate required monthly saving
  return (this.targetAmount - this.currentAmount) / (monthsRemaining || 1);
});

// Update timestamps when goal is modified
savingsGoalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount) {
    this.isCompleted = true;
  }
  
  next();
});

savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
