const express = require('express');
const { getExpenses, createExpense, getExpenseById, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getExpenses);
router.post('/', protect, createExpense);
router.get('/:id', protect, getExpenseById);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
