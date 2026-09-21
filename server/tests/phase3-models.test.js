const test = require('node:test');
const assert = require('node:assert/strict');

const Package = require('../models/Package');
const Quotation = require('../models/Quotation');

test('Package model exposes key package fields', () => {
  const fields = Object.keys(Package.schema.paths);
  assert.ok(fields.includes('name'));
  assert.ok(fields.includes('packageType'));
  assert.ok(fields.includes('basePrice'));
  assert.ok(fields.includes('createdBy'));
});

test('Quotation model exposes customer and pricing fields', () => {
  const fields = Object.keys(Quotation.schema.paths);
  assert.ok(fields.includes('customer'));
  assert.ok(fields.includes('package'));
  assert.ok(fields.includes('subtotal'));
  assert.ok(fields.includes('totalAmount'));
  assert.ok(fields.includes('status'));
});
