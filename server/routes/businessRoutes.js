const express = require('express');
const { getBusinessProfile, upsertBusinessProfile } = require('../controllers/businessController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', protect, getBusinessProfile);
router.put('/profile', protect, upsertBusinessProfile);

module.exports = router;
