const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

// VULNERABILITY: User enumeration endpoint — no auth required
router.get('/check-email', authController.checkEmail);

// VULNERABILITY: Password reset without token verification — no auth required
router.post('/reset-password', authController.resetPassword);

module.exports = router;
