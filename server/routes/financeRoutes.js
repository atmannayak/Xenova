const express = require('express');

const router = express.Router();

const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateMonthlyBudget,
  getFinanceSummary,
} = require('../controllers/financeController');

const { protect } = require('../middleware/authMiddleware');

// All finance routes require authentication
router.use(protect);

// Finance summary
router.get('/summary', getFinanceSummary);

// Monthly budget
router.put('/budget', updateMonthlyBudget);

// Transactions
router
  .route('/transactions')
  .get(getTransactions)
  .post(createTransaction);

// Update / Delete transaction
router
  .route('/transactions/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
