const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    category: {
      type: String,
      enum: ['Fuel', 'Toll', 'Parking', 'Food', 'Driver Allowance', 'Accommodation', 'Maintenance', 'Permit', 'Other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ createdBy: 1, trip: 1, expenseDate: -1 });
expenseSchema.index({ createdBy: 1, booking: 1 });
expenseSchema.index({ createdBy: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
