const express = require('express');
const { protect } = require('../middlewares/auth');
const { addTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController');
const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.post('/', addTransaction);
router.get('/', getTransactions);
router.delete('/:id', deleteTransaction);

module.exports = router;