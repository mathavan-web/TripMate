const express = require('express');
const { getEnquiries, createEnquiry, getEnquiryById, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getEnquiries);
router.post('/', protect, createEnquiry);
router.get('/:id', protect, getEnquiryById);
router.put('/:id', protect, updateEnquiry);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;
