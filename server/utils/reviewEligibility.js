const isReviewEligible = (trip, expectedTripId) => Boolean(
  trip
  && trip.status === 'Completed'
  && String(trip._id) === String(expectedTripId)
);

module.exports = { isReviewEligible };