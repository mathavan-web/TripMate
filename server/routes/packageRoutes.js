const express = require('express');
const { getPackages, createPackage, getPackageById, updatePackage, updatePackageStatus } = require('../controllers/packageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getPackages);
router.post('/', protect, createPackage);
router.get('/:id', protect, getPackageById);
router.put('/:id', protect, updatePackage);
router.patch('/:id/status', protect, updatePackageStatus);

module.exports = router;
