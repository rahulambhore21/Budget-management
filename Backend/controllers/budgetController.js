const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// Set budget limit
exports.setBudgetLimit = async (req, res) => {
  try {
    const { category, amount } = req.body;
    
    // Validate input
    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category is required'
      });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid positive amount is required'
      });
    }
    
    // Check if budget for this category already exists
    const existingBudget = await Budget.findOne({ 
      userId: req.user.id, 
      category 
    });
    
    if (existingBudget) {
      return res.status(400).json({
        status: 'fail',
        message: `A budget for ${category} already exists.`
      });
    }
    
    // Create new budget limit
    const budgetLimit = await Budget.create({
      userId: req.user.id,
      category,
      amount: parseFloat(amount)
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        limit: budgetLimit
      }
    });
  } catch (err) {
    console.error('Budget set error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all budget limits
exports.getBudgetLimits = async (req, res) => {
  try {
    const limits = await Budget.find({ userId: req.user.id });
    
    res.status(200).json({
      status: 'success',
      data: {
        limits
      }
    });
  } catch (err) {
    console.error('Get budget limits error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update budget limit
exports.updateBudgetLimit = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid positive amount is required'
      });
    }
    
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        status: 'fail',
        message: 'Budget limit not found'
      });
    }
    
    // Ensure user can only update their own budgets
    if (budget.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this budget'
      });
    }
    
    budget.amount = parseFloat(amount);
    await budget.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        limit: budget
      }
    });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete budget limit
exports.deleteBudgetLimit = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        status: 'fail',
        message: 'Budget limit not found'
      });
    }
    
    // Ensure user can only delete their own budgets
    if (budget.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this budget'
      });
    }
    
    await Budget.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Budget limit deleted successfully'
    });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get budget status (current month spending vs limits)
exports.getBudgetStatus = async (req, res) => {
  try {
    // Get all budget limits for user
    const limits = await Budget.find({ userId: req.user.id });
    
    // Calculate current month spending
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
    
    // Calculate spending by category
    const spendingByCategory = {};
    transactions.forEach(tx => {
      if (!spendingByCategory[tx.category]) {
        spendingByCategory[tx.category] = 0;
      }
      spendingByCategory[tx.category] += tx.amount;
    });
    
    // Calculate budget status for each category
    const budgetStatus = limits.map(limit => {
      const spent = spendingByCategory[limit.category] || 0;
      const remaining = limit.amount - spent;
      const percentUsed = (spent / limit.amount) * 100;
      
      return {
        category: limit.category,
        limit: limit.amount,
        spent,
        remaining,
        percentUsed,
        status: percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'normal'
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        budgetStatus,
        month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      }
    });
  } catch (err) {
    console.error('Get budget status error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get budget tips based on spending patterns
exports.getBudgetTips = async (req, res) => {
  try {
    // Mock tips for now
    // In a real-world scenario, this would analyze the user's spending patterns
    // and generate personalized tips
    const tips = [
      {
        id: 1,
        title: 'Follow the 50/30/20 Rule',
        content: 'Try to allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.'
      },
      {
        id: 2,
        title: 'Track Every Expense',
        content: 'Record all transactions to understand your spending patterns and identify areas for improvement.'
      },
      {
        id: 3,
        title: 'Use Cash for Discretionary Spending',
        content: 'Using cash instead of cards for non-essential purchases can help you be more mindful of your spending.'
      },
      {
        id: 4,
        title: 'Review Your Budget Regularly',
        content: 'Check your budget at least once a week to stay on track and make adjustments as needed.'
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: {
        tips
      }
    });
  } catch (err) {
    console.error('Get budget tips error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
