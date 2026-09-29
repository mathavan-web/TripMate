const test = require('node:test');
const assert = require('node:assert/strict');

const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');
const Review = require('../models/Review');
const Customer = require('../models/Customer');
const { getInvoicePaymentValues, nextInvoiceNumber } = require('../utils/invoiceService');
const { isReviewEligible } = require('../utils/reviewEligibility');
const { isWhatsAppConfigured, sendInvoiceDocument, buildWhatsAppShareUrl, normalizeWhatsAppNumber } = require('../utils/whatsappDelivery');

test('Invoice model exposes owner, relationship, snapshot, billing, and delivery fields', () => {
  const fields = Object.keys(Invoice.schema.paths);
  for (const field of [
    'invoiceNumber', 'business', 'customer', 'booking', 'trip', 'createdBy',
    'businessSnapshot', 'customerSnapshot', 'tripSnapshot', 'items', 'totalAmount',
    'amountPaid', 'balanceDue', 'paymentStatus', 'pdfStatus', 'pdfFileId', 'whatsappStatus',
    'publicAccessTokenHash', 'publicAccessTokenExpiresAt',
  ]) {
    assert.ok(fields.includes(field), `Invoice is missing ${field}`);
  }
  assert.deepEqual(Invoice.schema.path('paymentStatus').enumValues, ['PAID', 'PARTIALLY_PAID', 'UNPAID']);
  assert.deepEqual(Invoice.schema.path('pdfStatus').enumValues, ['PENDING', 'GENERATED', 'FAILED']);
  assert.deepEqual(Invoice.schema.path('whatsappStatus').enumValues, ['NOT_SENT', 'SENT', 'DELIVERED', 'FAILED']);
  assert.ok(Invoice.schema.indexes().some(([index, options]) => index.createdBy === 1 && index.trip === 1 && options.unique));
});

test('Invoice unique owner-trip index prevents duplicate invoices for the same trip', () => {
  assert.ok(Invoice.schema.indexes().some(([index, options]) => index.createdBy === 1 && index.trip === 1 && options.unique));
});

test('Invoice requires historical identity and billing data', () => {
  const invoice = new Invoice();
  const error = invoice.validateSync();
  assert.ok(error);
  for (const field of ['invoiceNumber', 'business', 'customer', 'booking', 'trip', 'createdBy', 'businessSnapshot', 'customerSnapshot', 'tripSnapshot', 'items', 'subtotal', 'totalAmount', 'balanceDue', 'paymentStatus']) {
    assert.ok(error.errors[field], `Expected ${field} to be required or invalid`);
  }
});

test('InvoiceSequence has a globally unique yearly counter key', () => {
  const fields = Object.keys(InvoiceSequence.schema.paths);
  assert.ok(fields.includes('year'));
  assert.ok(fields.includes('sequence'));
  assert.ok(InvoiceSequence.schema.indexes().some(([index, options]) => index.year === 1 && options.unique));
});

test('Invoice payment status uses net payments and never produces a negative balance', () => {
  assert.deepEqual(getInvoicePaymentValues(1000, 0), { amountPaid: 0, balanceDue: 1000, paymentStatus: 'UNPAID' });
  assert.deepEqual(getInvoicePaymentValues(1000, 400), { amountPaid: 400, balanceDue: 600, paymentStatus: 'PARTIALLY_PAID' });
  assert.deepEqual(getInvoicePaymentValues(1000, 1200), { amountPaid: 1200, balanceDue: 0, paymentStatus: 'PAID' });
  assert.deepEqual(getInvoicePaymentValues(1000, -50), { amountPaid: 0, balanceDue: 1000, paymentStatus: 'UNPAID' });
});

test('Review model links an owner, customer, and trip and restricts ratings', async () => {
  const fields = Object.keys(Review.schema.paths);
  for (const field of ['customer', 'trip', 'createdBy', 'rating', 'comment']) assert.ok(fields.includes(field));
  assert.ok(Review.schema.indexes().some(([index, options]) => index.createdBy === 1 && index.trip === 1 && options.unique));
  const review = new Review({ rating: 6 });
  const error = review.validateSync();
  assert.ok(error.errors.rating);
});

test('Invoice keeps its snapshot independent of later source-object changes', () => {
  const sourceCustomer = { name: 'Before' };
  const invoice = new Invoice({ customerSnapshot: sourceCustomer });
  sourceCustomer.name = 'After';
  assert.equal(invoice.customerSnapshot.name, 'Before');
});

test('Invoice numbers increment atomically for each year', async () => {
  const originalFindOneAndUpdate = InvoiceSequence.findOneAndUpdate;
  const calls = [];
  let sequence = 0;
  InvoiceSequence.findOneAndUpdate = async (filter, update, options) => {
    calls.push({ filter, update, options });
    sequence += 1;
    return { sequence };
  };
  try {
    const numbers = await Promise.all([
      nextInvoiceNumber(2026),
      nextInvoiceNumber(2026),
      nextInvoiceNumber(2026),
    ]);
    assert.deepEqual(numbers, ['INV-2026-0001', 'INV-2026-0002', 'INV-2026-0003']);
    assert.ok(calls.every(({ update }) => update.$inc.sequence === 1));
    assert.ok(calls.every(({ filter }) => filter.year === 2026));
  } finally {
    InvoiceSequence.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('Only the matching completed trip is eligible for a review', () => {
  assert.equal(isReviewEligible({ _id: 'trip-1', status: 'Completed' }, 'trip-1'), true);
  assert.equal(isReviewEligible({ _id: 'trip-1', status: 'Started' }, 'trip-1'), false);
  assert.equal(isReviewEligible({ _id: 'trip-1', status: 'Completed' }, 'trip-2'), false);
});

test('WhatsApp consent is explicit on customers and preserved in invoice snapshots', () => {
  assert.equal(Customer.schema.path('whatsappOptIn').defaultValue, false);
  assert.ok(Invoice.schema.path('customerSnapshot.whatsappOptIn'));
});

test('WhatsApp remains optional and refuses to send without current customer opt-in', async () => {
  const names = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_GRAPH_API_VERSION'];
  const previousValues = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(isWhatsAppConfigured(), false);
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-number';
    process.env.WHATSAPP_GRAPH_API_VERSION = 'v99.0';
    assert.equal(isWhatsAppConfigured(), true);
    await assert.rejects(
      sendInvoiceDocument({ pdfFileId: 'unused', customerSnapshot: { whatsappOptIn: true } }, { whatsappOptIn: false }),
      /consent is required/
    );
  } finally {
    for (const name of names) {
      if (previousValues[name] === undefined) delete process.env[name];
      else process.env[name] = previousValues[name];
    }
  }
});

test('WhatsApp share URLs normalize Indian numbers and encode invoice details', () => {
  assert.equal(normalizeWhatsAppNumber('+91 98765 43210'), '919876543210');
  assert.equal(normalizeWhatsAppNumber('09876543210'), '919876543210');

  const shareUrl = buildWhatsAppShareUrl({
    customerSnapshot: { name: 'Asha', phone: '+91 98765 43210' },
    businessSnapshot: { businessName: 'TripMate Tours' },
    invoiceNumber: 'INV-2026-0001',
    totalAmount: 2450,
    amountPaid: 2000,
    balanceDue: 450,
  }, 'https://example.com/invoice/test-token');

  assert.match(shareUrl, /^https:\/\/wa\.me\/919876543210\?/);
  assert.match(shareUrl, /invoice%20No%3A%20INV-2026-0001/i);
  assert.match(shareUrl, /https%3A%2F%2Fexample.com%2Finvoice%2Ftest-token/i);
});