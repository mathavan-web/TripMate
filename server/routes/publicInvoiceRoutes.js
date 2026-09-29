const express = require('express');
const { getPublicInvoice, downloadPublicInvoicePdf } = require('../controllers/invoiceController');

const router = express.Router();

router.get('/invoices/:token', getPublicInvoice);
router.get('/invoices/:token/pdf', downloadPublicInvoicePdf);

module.exports = router;
