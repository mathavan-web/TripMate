const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      default: null,
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    travelDate: {
      type: Date,
      default: null,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: '',
    },
    dropLocation: {
      type: String,
      trim: true,
      default: '',
    },
    destination: {
      type: String,
      trim: true,
      default: '',
    },
    numberOfPassengers: {
      type: Number,
      default: 1,
      min: 1,
    },
    vehicleType: {
      type: String,
      trim: true,
      default: '',
    },
    specialRequirements: {
      type: String,
      trim: true,
      default: '',
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
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

bookingSchema.index({ createdBy: 1, status: 1 });
bookingSchema.index({ createdBy: 1, customer: 1 });
bookingSchema.index({ createdBy: 1, bookingNumber: 1 }, { unique: true });
bookingSchema.index({ createdBy: 1, quotation: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Booking', bookingSchema);
