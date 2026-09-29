const express = require('express');
const {
  createReviewInvitation,
  downloadInvoicePdf,
  getInvoiceById,
  getInvoices,
  retryInvoicePdf,
  retryWhatsAppDelivery,
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/webhook', verifyWhatsAppWebhook);
router.post('/webhook', handleWhatsAppWebhook);
router.post('/:id/review-invitation', protect, createReviewInvitation);
router.post('/:id/whatsapp-share', protect, require('../controllers/invoiceController').createWhatsAppShareLink);
router.get('/:id/pdf', protect, downloadInvoicePdf);
router.post('/:id/retry-pdf', protect, retryInvoicePdf);
router.post('/:id/retry-whatsapp', protect, retryWhatsAppDelivery);
router.get('/:id', protect, getInvoiceById);

module.exports = router;