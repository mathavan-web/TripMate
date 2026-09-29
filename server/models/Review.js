const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

reviewSchema.index({ createdBy: 1, createdAt: -1 });
reviewSchema.index({ createdBy: 1, trip: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);