const express = require('express');
const router = express.Router();
const {
    forgotPassword,
    verifyResetToken,
    resetPassword
} = require('../controllers/passwordResetController');
const { authUser } = require('../controllers/userController');
const { sendOTP, verifyAndRegister } = require('../controllers/authController');

// @route   POST /api/auth/login
router.post('/login', authUser);

// @route   POST /api/auth/send-otp
router.post('/send-otp', sendOTP);

// @route   POST /api/auth/verify-register
router.post('/verify-register', verifyAndRegister);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', verifyResetToken);

// @route   PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', resetPassword);

module.exports = router;
