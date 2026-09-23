const express = require('express');
const { getTrips, createTrip, getTripById, updateTrip, updateTripStatus, getTripFinancialSummary } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getTrips);
router.post('/', protect, createTrip);
router.get('/:id/financial-summary', protect, getTripFinancialSummary);
router.get('/:id', protect, getTripById);
router.put('/:id', protect, updateTrip);
router.patch('/:id/status', protect, updateTripStatus);

module.exports = router;
