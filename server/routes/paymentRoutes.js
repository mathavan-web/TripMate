const express = require('express');
const { getPayments, createPayment, getPaymentById, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getPayments);
router.post('/', protect, createPayment);
router.get('/:id', protect, getPaymentById);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

module.exports = router;
