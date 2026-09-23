const test = require('node:test');
const assert = require('node:assert/strict');

const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { sumPayments } = require('../utils/financials');

test('Payment model exposes payment and ownership fields', () => {
  const fields = Object.keys(Payment.schema.paths);
  assert.ok(fields.includes('paymentNumber'));
  assert.ok(fields.includes('booking'));
  assert.ok(fields.includes('trip'));
  assert.ok(fields.includes('customer'));
  assert.ok(fields.includes('amount'));
  assert.ok(fields.includes('paymentDate'));
  assert.ok(fields.includes('paymentMethod'));
  assert.ok(fields.includes('paymentType'));
  assert.ok(fields.includes('createdBy'));
  assert.deepEqual(Payment.schema.path('paymentMethod').enumValues, ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other']);
  assert.deepEqual(Payment.schema.path('paymentType').enumValues, ['Advance', 'Partial Payment', 'Final Payment', 'Refund']);
});

test('Expense model exposes trip cost and ownership fields', () => {
  const fields = Object.keys(Expense.schema.paths);
  assert.ok(fields.includes('expenseNumber'));
  assert.ok(fields.includes('trip'));
  assert.ok(fields.includes('booking'));
  assert.ok(fields.includes('category'));
  assert.ok(fields.includes('amount'));
  assert.ok(fields.includes('expenseDate'));
  assert.ok(fields.includes('paymentMethod'));
  assert.ok(fields.includes('createdBy'));
  assert.ok(Expense.schema.path('category').enumValues.includes('Fuel'));
  assert.ok(Expense.schema.path('category').enumValues.includes('Driver Allowance'));
});

test('payment totals subtract refunds from collected payments', () => {
  const totalPaid = sumPayments([
    { amount: 10000, paymentType: 'Advance' },
    { amount: 5000, paymentType: 'Partial Payment' },
    { amount: 2000, paymentType: 'Refund' },
  ]);

  assert.equal(totalPaid, 13000);
});
