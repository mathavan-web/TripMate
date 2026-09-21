const express = require('express');
const { registerUser, loginUser, getCurrentUser, logoutUser, updateCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

module.exports = router;
