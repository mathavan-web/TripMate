const express = require('express');
const { getBookings, createBooking, getBookingById, updateBooking, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getBookings);
router.post('/', protect, createBooking);
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.patch('/:id/status', protect, updateBookingStatus);

module.exports = router;
