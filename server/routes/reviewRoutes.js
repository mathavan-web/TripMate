const express = require('express');
const { getReviews, submitReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/submit', submitReview);
router.get('/', protect, getReviews);

module.exports = router;