const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Trip = require('../models/Trip');
const Review = require('../models/Review');
const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { createReviewToken, ensureInvoiceAccessToken, refreshInvoicePayments } = require('../utils/invoiceService');
const { openInvoicePdf, storeInvoicePdf } = require('../utils/invoicePdf');
const { buildWhatsAppShareUrl, isWhatsAppConfigured, normalizeWhatsAppNumber, sendInvoiceDocument } = require('../utils/whatsappDelivery');
const { isReviewEligible } = require('../utils/reviewEligibility');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildPublicInvoicePayload = (invoice) => ({
  _id: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  invoiceDate: invoice.invoiceDate,
  invoiceStatus: invoice.paymentStatus,
  paymentStatus: invoice.paymentStatus,
  totalAmount: invoice.totalAmount,
  amountPaid: invoice.amountPaid,
  balanceDue: invoice.balanceDue,
  businessSnapshot: invoice.businessSnapshot,
  customerSnapshot: invoice.customerSnapshot,
  tripSnapshot: invoice.tripSnapshot,
  items: invoice.items,
  subtotal: invoice.subtotal,
  pdfStatus: invoice.pdfStatus,
});

const generatePdf = async (invoice) => {
  if (invoice.pdfStatus === 'GENERATED' && invoice.pdfFileId) return invoice;
  invoice.pdfStatus = 'PENDING';
  invoice.pdfError = '';
  await invoice.save();
  try {
    invoice.pdfFileId = await storeInvoicePdf(invoice);
    invoice.pdfStatus = 'GENERATED';
  } catch (error) {
    invoice.pdfStatus = 'FAILED';
    invoice.pdfError = 'PDF generation failed. Retry from invoice history.';
  }
  await invoice.save();
  return invoice;
};

const sendWhatsApp = async (invoice, explicitRetry = false) => {
  if (!isWhatsAppConfigured()) {
    if (explicitRetry) {
      invoice.whatsappStatus = 'FAILED';
      invoice.whatsappError = 'WhatsApp Cloud API is not configured';
      await invoice.save();
    }
    return invoice;
  }
  if (!invoice.pdfFileId || invoice.pdfStatus !== 'GENERATED') {
    invoice.whatsappStatus = 'FAILED';
    invoice.whatsappError = 'Generate the PDF before WhatsApp delivery';
    await invoice.save();
    return invoice;
  }
  try {
    const customer = await Customer.findOne({ _id: invoice.customer, createdBy: invoice.createdBy });
    if (!customer || customer.whatsappOptIn !== true) throw new Error('Current customer WhatsApp consent is required');
    const messageId = await sendInvoiceDocument(invoice, customer);
    invoice.whatsappStatus = 'SENT';
    invoice.whatsappMessageId = messageId || '';
    invoice.whatsappSentAt = new Date();
    invoice.whatsappError = '';
  } catch (error) {
    invoice.whatsappStatus = 'FAILED';
    invoice.whatsappError = error.message || 'WhatsApp delivery failed';
  }
  await invoice.save();
  return invoice;
};

const verifyWhatsAppWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

const handleWhatsAppWebhook = async (req, res) => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  const signature = req.get('x-hub-signature-256') || '';
  if (!secret || !req.rawBody || !signature.startsWith('sha256=')) return res.sendStatus(401);
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) return res.sendStatus(401);

  try {
    const statuses = (req.body.entry || []).flatMap((entry) => (entry.changes || []).flatMap((change) => change.value?.statuses || []));
    await Promise.all(statuses.map(async (status) => {
      if (!status.id || !['delivered', 'read', 'failed'].includes(status.status)) return;
      const update = status.status === 'failed'
        ? { whatsappStatus: 'FAILED', whatsappError: 'WhatsApp reported delivery failure' }
        : { whatsappStatus: 'DELIVERED', whatsappDeliveredAt: new Date(Number(status.timestamp || 0) * 1000), whatsappError: '' };
      await Invoice.updateOne({ whatsappMessageId: status.id }, { $set: update });
    }));
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
};

const getInvoices = async (req, res) => {
  try {
    const { search, paymentStatus, pdfStatus, whatsappStatus } = req.query;
    const filter = { createdBy: req.user._id };
    if (paymentStatus && paymentStatus !== 'All') filter.paymentStatus = paymentStatus;
    if (pdfStatus && pdfStatus !== 'All') filter.pdfStatus = pdfStatus;
    if (whatsappStatus && whatsappStatus !== 'All') filter.whatsappStatus = whatsappStatus;
    if (search) {
      const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ invoiceNumber: pattern }, { 'customerSnapshot.name': pattern }, { 'tripSnapshot.bookingNumber': pattern }];
    }
    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 });
    return successResponse(res, 200, 'Invoices fetched successfully', invoices);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoices');
  }
};

const getInvoiceById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    return successResponse(res, 200, 'Invoice fetched successfully', invoice);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoice');
  }
};

const downloadInvoicePdf = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    if (invoice.pdfStatus !== 'GENERATED' || !invoice.pdfFileId) return errorResponse(res, 409, 'Invoice PDF is not available');
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`, 'Cache-Control': 'private, no-store' });
    return openInvoicePdf(invoice.pdfFileId, res);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to download invoice PDF');
  }
};

const retryInvoicePdf = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    const result = await generatePdf(invoice);
    return successResponse(res, result.pdfStatus === 'GENERATED' ? 200 : 502, result.pdfStatus === 'GENERATED' ? 'Invoice PDF generated' : 'Invoice exists, but PDF generation failed', result);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retry invoice PDF generation');
  }
};

const retryWhatsAppDelivery = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    const result = await sendWhatsApp(invoice, true);
    const success = result.whatsappStatus === 'SENT' || result.whatsappStatus === 'DELIVERED';
    return successResponse(res, success ? 200 : 502, success ? 'Invoice sent to WhatsApp' : 'Invoice delivery failed; retry is available', result);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retry WhatsApp delivery');
  }
};

const createWhatsAppShareLink = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');

    const customerPhone = normalizeWhatsAppNumber(invoice.customerSnapshot?.whatsapp || invoice.customerSnapshot?.phone || '');
    if (!customerPhone) {
      return errorResponse(res, 400, 'Customer WhatsApp number is not available. Please update the customer contact number.');
    }

    const token = await ensureInvoiceAccessToken(invoice);
    const publicUrl = `${(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/invoice/${token || ''}`;
    const whatsappUrl = buildWhatsAppShareUrl(invoice, publicUrl);
    if (!whatsappUrl) {
      return errorResponse(res, 400, 'Unable to generate the invoice link. Please try again.');
    }

    return successResponse(res, 200, 'WhatsApp share link ready', {
      invoiceUrl: publicUrl,
      whatsappUrl,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerSnapshot?.name || 'Customer',
    });
  } catch (error) {
    return errorResponse(res, 500, 'Unable to generate the WhatsApp share link.');
  }
};

const getPublicInvoice = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) return errorResponse(res, 404, 'This invoice link is invalid or unavailable.');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invoice = await Invoice.findOne({
      publicAccessTokenHash: tokenHash,
      publicAccessTokenExpiresAt: { $gt: new Date() },
    }).select('+publicAccessTokenHash +publicAccessTokenExpiresAt');

    if (!invoice) return errorResponse(res, 404, 'This invoice link is invalid or unavailable.');

    return successResponse(res, 200, 'Invoice fetched successfully', buildPublicInvoicePayload(invoice));
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoice');
  }
};

const downloadPublicInvoicePdf = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) return errorResponse(res, 404, 'This invoice link is invalid or unavailable.');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invoice = await Invoice.findOne({
      publicAccessTokenHash: tokenHash,
      publicAccessTokenExpiresAt: { $gt: new Date() },
    }).select('+publicAccessTokenHash +publicAccessTokenExpiresAt');

    if (!invoice) return errorResponse(res, 404, 'This invoice link is invalid or unavailable.');
    if (invoice.pdfStatus !== 'GENERATED' || !invoice.pdfFileId) return errorResponse(res, 409, 'Invoice PDF is not available');

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`, 'Cache-Control': 'private, no-store' });
    return openInvoicePdf(invoice.pdfFileId, res);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to download invoice PDF');
  }
};

const createReviewInvitation = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Invoice ID is invalid');
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    const trip = await Trip.findOne({ _id: invoice.trip, createdBy: req.user._id, status: 'Completed' });
    if (!isReviewEligible(trip, invoice.trip)) return errorResponse(res, 400, 'Reviews are available only for completed trips');
    const existing = await Review.findOne({ trip: trip._id, createdBy: req.user._id });
    if (existing) return errorResponse(res, 409, 'A review already exists for this trip');
    const token = createReviewToken();
    invoice.reviewTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    invoice.reviewTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await invoice.save();
    return successResponse(res, 201, 'Review invitation created', { token, expiresAt: invoice.reviewTokenExpiresAt });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create review invitation');
  }
};

module.exports = {
  createReviewInvitation,
  createWhatsAppShareLink,
  downloadInvoicePdf,
  downloadPublicInvoicePdf,
  generatePdf,
  getInvoiceById,
  getInvoices,
  getPublicInvoice,
  retryInvoicePdf,
  retryWhatsAppDelivery,
  sendWhatsApp,
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
};