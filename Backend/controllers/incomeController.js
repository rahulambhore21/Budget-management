const Income = require('../models/Income');
const mongoose = require('mongoose');
// Add new income
exports.addIncome = async (req, res) => {
  try {
    const { amount, source, description, date, isRecurring, recurringFrequency, taxable } = req.body;
    
    // Basic validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive amount'
      });
    }
    
    if (!source) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an income source'
      });
    }
    
    // Create income entry
    const income = await Income.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      source,
      description: description || '',
      date: date ? new Date(date) : Date.now(),
      isRecurring: isRecurring || false,
      recurringFrequency: isRecurring ? (recurringFrequency || 'monthly') : 'monthly',
      taxable: taxable !== undefined ? taxable : true
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        income
      }
    });
  } catch (err) {
    console.error('Add income error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all income entries for user
exports.getIncomes = async (req, res) => {
  try {
    // Parse query parameters
    const { startDate, endDate, source } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Source filter
    if (source) {
      query.source = source;
    }
    
    const incomes = await Income.find(query).sort({ date: -1 });
    
    res.status(200).json({
      status: 'success',
      results: incomes.length,
      data: {
        incomes
      }
    });
  } catch (err) {
    console.error('Get incomes error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update income entry
exports.updateIncome = async (req, res) => {
  try {
    const { amount, source, description, date, isRecurring, recurringFrequency, taxable } = req.body;
    
    // Find the income entry
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({
        status: 'fail',
        message: 'Income entry not found'
      });
    }
    
    // Ensure user can only update their own income entries
    if (income.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this income entry'
      });
    }
    
    // Update fields
    if (amount) {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Amount must be a positive number'
        });
      }
      income.amount = parseFloat(amount);
    }
    
    if (source) income.source = source;
    if (description !== undefined) income.description = description;
    if (date) income.date = new Date(date);
    if (isRecurring !== undefined) income.isRecurring = isRecurring;
    if (recurringFrequency) income.recurringFrequency = recurringFrequency;
    if (taxable !== undefined) income.taxable = taxable;
    
    await income.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        income
      }
    });
  } catch (err) {
    console.error('Update income error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete income entry
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({
        status: 'fail',
        message: 'Income entry not found'
      });
    }
    
    // Ensure user can only delete their own income entries
    if (income.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this income entry'
      });
    }
    
    await Income.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Income entry deleted successfully'
    });
  } catch (err) {
    console.error('Delete income error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get income statistics
exports.getIncomeStats = async (req, res) => {
  try {
    // Get total income by month for the last 12 months
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // Aggregate income by month
    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(req.user.id),
          date: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$date" }, 
            month: { $month: "$date" } 
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Aggregate income by source
    const incomeBySource = await Income.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(req.user.id),
          date: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: "$source",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "total": -1 }
      }
    ]);
    
    // Calculate total income for current month
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const currentMonthTotal = await Income.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(req.user.id),
          date: { 
            $gte: currentMonth,
            $lt: nextMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate running total for current year
    const currentYear = new Date(today.getFullYear(), 0, 1);
    const nextYear = new Date(today.getFullYear() + 1, 0, 1);
    
    const currentYearTotal = await Income.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(req.user.id),
          date: { 
            $gte: currentYear,
            $lt: nextYear
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        monthlyIncome,
        incomeBySource,
        currentMonth: {
          total: currentMonthTotal.length > 0 ? currentMonthTotal[0].total : 0,
          count: currentMonthTotal.length > 0 ? currentMonthTotal[0].count : 0
        },
        currentYear: {
          total: currentYearTotal.length > 0 ? currentYearTotal[0].total : 0,
          count: currentYearTotal.length > 0 ? currentYearTotal[0].count : 0
        }
      }
    });
  } catch (err) {
    console.error('Get income stats error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
