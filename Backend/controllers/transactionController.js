const Transaction = require('../models/Transaction');

// Add transaction
exports.addTransaction = async (req, res) => {
  try {
    console.log('Received transaction data:', req.body);
    const { amount, category, paymentMode, upiId, description, date } = req.body;

    // Validate required fields
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'A positive amount is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category is required'
      });
    }

    if (!paymentMode) {
      return res.status(400).json({
        status: 'fail',
        message: 'Payment mode is required'
      });
    }

    // Define GST rates
    const gstRates = {
      'Food': 5,
      'Transport': 12,
      'Shopping': 18,
      'Bills': 0,
      'Investment': 0,
      'Other': 18
    };
    
    const transaction = await Transaction.create({
      userId: req.user.id,
      amount: Number(amount),
      category,
      paymentMode,
      upiId: paymentMode === 'UPI' ? upiId : undefined,
      description,
      gstRate: gstRates[category] || 0,
      date: date || Date.now()
    });

    console.log('Transaction created:', transaction);

    res.status(201).json({
      status: 'success',
      data: {
        transaction,
        message: `₹${amount} expense recorded successfully`
      }
    });
  } catch (err) {
    console.error('Transaction add error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 }); // Sort by date descending (newest first)

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions
      }
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }
    
    // Check if transaction belongs to the authenticated user
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this transaction'
      });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};