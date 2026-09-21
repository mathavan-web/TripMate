const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    packageType: {
      type: String,
      enum: ['Tour Package', 'Local Sightseeing', 'Jeep Safari', 'Airport Transfer', 'Outstation', 'One Way', 'Round Trip', 'Custom'],
      default: 'Tour Package',
    },
    duration: {
      type: String,
      trim: true,
      default: '1 Day',
    },
    numberOfDays: {
      type: Number,
      default: 1,
      min: 1,
    },
    numberOfNights: {
      type: Number,
      default: 0,
      min: 0,
    },
    destinations: [{ type: String, trim: true }],
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
    vehicleType: {
      type: String,
      trim: true,
      default: '',
    },
    maxPassengers: {
      type: Number,
      default: 1,
      min: 1,
    },
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ['Per Trip', 'Per Person', 'Per Day'],
      default: 'Per Trip',
    },
    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],
    termsAndConditions: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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

packageSchema.index({ createdBy: 1, isActive: 1 });
packageSchema.index({ createdBy: 1, packageType: 1 });

module.exports = mongoose.model('Package', packageSchema);
