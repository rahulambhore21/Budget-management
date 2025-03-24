const express = require('express');
const { protect } = require('../middlewares/auth');
const { 
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  deleteSavingsGoal,
  addContribution
} = require('../controllers/savingsGoalController');

const router = express.Router();

// Protect all routes
router.use(protect);

router.post('/', createSavingsGoal);
router.get('/', getSavingsGoals);
router.get('/:id', getSavingsGoalById);
router.put('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);
router.post('/:id/contribute', addContribution);

module.exports = router;
