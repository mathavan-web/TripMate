const express = require('express');
const { getQuotations, createQuotation, getQuotationById, updateQuotation, updateQuotationStatus } = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getQuotations);
router.post('/', protect, createQuotation);
router.get('/:id', protect, getQuotationById);
router.put('/:id', protect, updateQuotation);
router.patch('/:id/status', protect, updateQuotationStatus);

module.exports = router;
