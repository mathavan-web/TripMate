const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    numberOfPassengers: {
      type: Number,
      default: 1,
      min: 1,
    },
    vehiclePreference: {
      type: String,
      trim: true,
      default: '',
    },
    travelType: {
      type: String,
      enum: ['Local Trip', 'Outstation', 'Tour Package', 'Airport Transfer', 'Safari', 'One Way', 'Round Trip', 'Other'],
      default: 'Local Trip',
    },
    specialRequirements: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Quoted', 'Follow-up', 'Confirmed', 'Cancelled', 'Lost'],
      default: 'New',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ createdBy: 1, customer: 1 });
enquirySchema.index({ createdBy: 1, status: 1 });
enquirySchema.index({ createdBy: 1, travelDate: 1 });

enquirySchema.virtual('customerInfo', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('Enquiry', enquirySchema);
