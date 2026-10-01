const test = require('node:test');
const assert = require('node:assert/strict');

const { getPaymentValue, sumPayments } = require('../utils/financials');

test('payment utilities treat refunds as negative values and keep balances accurate', () => {
  assert.equal(getPaymentValue({ amount: 1500, paymentType: 'Final Payment' }), 1500);
  assert.equal(getPaymentValue({ amount: 350, paymentType: 'Refund' }), -350);
  assert.equal(sumPayments([
    { amount: 2400, paymentType: 'Advance' },
    { amount: 500, paymentType: 'Partial Payment' },
    { amount: 300, paymentType: 'Refund' },
  ]), 2600);
});
