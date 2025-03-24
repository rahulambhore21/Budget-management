const express = require('express');
const { protect } = require('../middlewares/auth');
const { 
  setBudgetLimit, 
  getBudgetLimits, 
  updateBudgetLimit, 
  deleteBudgetLimit,
  getBudgetStatus,
  getBudgetTips
} = require('../controllers/budgetController');

const router = express.Router();

// Protect all routes
router.use(protect);

router.post('/', setBudgetLimit);
router.get('/', getBudgetLimits);
router.put('/:id', updateBudgetLimit);
router.delete('/:id', deleteBudgetLimit);
router.get('/status', getBudgetStatus);
router.get('/tips', getBudgetTips);

module.exports = router;
