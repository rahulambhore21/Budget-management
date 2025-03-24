const SavingsGoal = require('../models/SavingsGoal');
const Notification = require('../models/Notification');

// Create a new savings goal
exports.createSavingsGoal = async (req, res) => {
  try {
    const { name, targetAmount, targetDate, description, category } = req.body;
    
    // Basic validation
    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, target amount, and target date'
      });
    }
    
    if (isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Target amount must be a positive number'
      });
    }
    
    const goalDate = new Date(targetDate);
    if (isNaN(goalDate.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid target date'
      });
    }
    
    const savingsGoal = await SavingsGoal.create({
      userId: req.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate: goalDate,
      description: description || '',
      category: category || 'Other',
      currentAmount: 0
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (err) {
    console.error('Create savings goal error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all savings goals for user
exports.getSavingsGoals = async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: savingsGoals.length,
      data: {
        savingsGoals
      }
    });
  } catch (err) {
    console.error('Get savings goals error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get a specific savings goal
exports.getSavingsGoalById = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findById(req.params.id);
    
    if (!savingsGoal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Savings goal not found'
      });
    }
    
    // Ensure user can only access their own savings goals
    if (savingsGoal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to access this savings goal'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (err) {
    console.error('Get savings goal by ID error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update a savings goal
exports.updateSavingsGoal = async (req, res) => {
  try {
    const { name, targetAmount, targetDate, description, category } = req.body;
    
    // Find the savings goal
    const savingsGoal = await SavingsGoal.findById(req.params.id);
    
    if (!savingsGoal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Savings goal not found'
      });
    }
    
    // Ensure user can only update their own savings goals
    if (savingsGoal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this savings goal'
      });
    }
    
    // Update fields
    if (name) savingsGoal.name = name;
    if (description !== undefined) savingsGoal.description = description;
    if (category) savingsGoal.category = category;
    
    if (targetAmount) {
      if (isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Target amount must be a positive number'
        });
      }
      savingsGoal.targetAmount = parseFloat(targetAmount);
    }
    
    if (targetDate) {
      const goalDate = new Date(targetDate);
      if (isNaN(goalDate.getTime())) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide a valid target date'
        });
      }
      savingsGoal.targetDate = goalDate;
    }
    
    // Check if goal is now complete
    if (savingsGoal.currentAmount >= savingsGoal.targetAmount && !savingsGoal.isCompleted) {
      savingsGoal.isCompleted = true;
      
      // Create a notification for goal completion
      await Notification.create({
        userId: req.user.id,
        type: 'goal_completed',
        title: 'Saving Goal Achieved!',
        message: `Congratulations! You've reached your saving goal for "${savingsGoal.name}".`,
        relatedTo: 'goal',
        relatedId: savingsGoal._id,
        isPriority: true
      });
    }
    
    await savingsGoal.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (err) {
    console.error('Update savings goal error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete a savings goal
exports.deleteSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findById(req.params.id);
    
    if (!savingsGoal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Savings goal not found'
      });
    }
    
    // Ensure user can only delete their own savings goals
    if (savingsGoal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this savings goal'
      });
    }
    
    await SavingsGoal.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Savings goal deleted successfully'
    });
  } catch (err) {
    console.error('Delete savings goal error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Add a contribution to a savings goal
exports.addContribution = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive amount'
      });
    }
    
    const savingsGoal = await SavingsGoal.findById(req.params.id);
    
    if (!savingsGoal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Savings goal not found'
      });
    }
    
    // Ensure user can only contribute to their own savings goals
    if (savingsGoal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to contribute to this savings goal'
      });
    }
    
    // Update current amount
    const newAmount = savingsGoal.currentAmount + parseFloat(amount);
    savingsGoal.currentAmount = newAmount;
    
    // Check if goal is now complete
    if (newAmount >= savingsGoal.targetAmount && !savingsGoal.isCompleted) {
      savingsGoal.isCompleted = true;
      
      // Create a notification for goal completion
      await Notification.create({
        userId: req.user.id,
        type: 'goal_completed',
        title: 'Saving Goal Achieved!',
        message: `Congratulations! You've reached your saving goal for "${savingsGoal.name}".`,
        relatedTo: 'goal',
        relatedId: savingsGoal._id,
        isPriority: true
      });
    }
    
    await savingsGoal.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (err) {
    console.error('Add contribution error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
