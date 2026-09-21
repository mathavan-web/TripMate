const test = require('node:test');
const assert = require('node:assert/strict');

const Customer = require('../models/Customer');
const Enquiry = require('../models/Enquiry');

test('Customer model exposes expected fields', () => {
  const customerFields = Object.keys(Customer.schema.paths);
  assert.ok(customerFields.includes('name'));
  assert.ok(customerFields.includes('phone'));
  assert.ok(customerFields.includes('createdBy'));
});

test('Enquiry model exposes customer and status fields', () => {
  const enquiryFields = Object.keys(Enquiry.schema.paths);
  assert.ok(enquiryFields.includes('customer'));
  assert.ok(enquiryFields.includes('status'));
  assert.ok(enquiryFields.includes('travelDate'));
});
