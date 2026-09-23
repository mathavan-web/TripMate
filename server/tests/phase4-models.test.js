const test = require('node:test');
const assert = require('node:assert/strict');

const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

test('Booking model exposes booking and financial fields', () => {
  const fields = Object.keys(Booking.schema.paths);
  assert.ok(fields.includes('bookingNumber'));
  assert.ok(fields.includes('customer'));
  assert.ok(fields.includes('quotation'));
  assert.ok(fields.includes('totalAmount'));
  assert.ok(fields.includes('status'));
  assert.ok(fields.includes('createdBy'));
});

test('Trip model exposes booking and driver/vehicle fields', () => {
  const fields = Object.keys(Trip.schema.paths);
  assert.ok(fields.includes('booking'));
  assert.ok(fields.includes('customer'));
  assert.ok(fields.includes('driverName'));
  assert.ok(fields.includes('vehicleModel'));
  assert.ok(fields.includes('status'));
  assert.ok(fields.includes('createdBy'));
});
