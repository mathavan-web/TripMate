const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
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
    driverName: {
      type: String,
      trim: true,
      default: '',
    },
    driverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleModel: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleType: {
      type: String,
      trim: true,
      default: '',
    },
    passengerCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Started', 'Completed', 'Cancelled'],
      default: 'Scheduled',
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

tripSchema.index({ createdBy: 1, status: 1 });
tripSchema.index({ createdBy: 1, customer: 1 });
tripSchema.index({ createdBy: 1, booking: 1 }, { unique: true, sparse: true });
tripSchema.index({ createdBy: 1, travelDate: 1 });

module.exports = mongoose.model('Trip', tripSchema);
