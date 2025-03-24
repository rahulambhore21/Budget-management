const express = require('express');
const { protect } = require('../middlewares/auth');
const { 
  addIncome, 
  getIncomes, 
  deleteIncome,
  updateIncome,
  getIncomeStats
} = require('../controllers/incomeController');

const router = express.Router();

// Protect all routes
router.use(protect);

router.post('/', addIncome);
router.get('/', getIncomes);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);
router.get('/stats', getIncomeStats);

module.exports = router;
