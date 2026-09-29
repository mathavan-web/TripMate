const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Trip = require('../models/Trip');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { isReviewEligible } = require('../utils/reviewEligibility');

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ createdBy: req.user._id })
      .populate('customer', 'name phone email')
      .populate('trip', 'destination travelDate returnDate status')
      .sort({ createdAt: -1 });
    return successResponse(res, 200, 'Reviews fetched successfully', reviews);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch reviews');
  }
};

const submitReview = async (req, res) => {
  try {
    const { token, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (typeof token !== 'string' || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return errorResponse(res, 400, 'A valid review token and rating from 1 to 5 are required');
    }
    if (comment !== undefined && (typeof comment !== 'string' || comment.length > 2000)) {
      return errorResponse(res, 400, 'Review comment must be 2000 characters or fewer');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invoice = await Invoice.findOne({
      reviewTokenHash: tokenHash,
      reviewTokenExpiresAt: { $gt: new Date() },
    }).select('+reviewTokenHash +reviewTokenExpiresAt');
    if (!invoice) return errorResponse(res, 410, 'Review link is invalid or expired');

    const trip = await Trip.findOne({ _id: invoice.trip, createdBy: invoice.createdBy, status: 'Completed' });
    if (!isReviewEligible(trip, invoice.trip)) return errorResponse(res, 400, 'Reviews are available only for completed trips');

    const review = await Review.create({
      customer: invoice.customer,
      trip: trip._id,
      createdBy: invoice.createdBy,
      rating: numericRating,
      comment: (comment || '').trim(),
    });
    await Invoice.updateOne(
      { _id: invoice._id, reviewTokenHash: tokenHash },
      { $unset: { reviewTokenHash: 1, reviewTokenExpiresAt: 1 } }
    );
    return successResponse(res, 201, 'Thank you for your review', { rating: review.rating });
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, 409, 'A review has already been submitted for this trip');
    if (error instanceof mongoose.Error.ValidationError) return errorResponse(res, 400, 'Review is invalid');
    return errorResponse(res, 500, 'Failed to submit review');
  }
};

module.exports = { getReviews, submitReview };