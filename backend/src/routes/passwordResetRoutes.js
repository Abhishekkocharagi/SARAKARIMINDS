const express = require('express');
const router = express.Router();
const {
    forgotPassword,
    verifyResetToken,
    resetPassword
} = require('../controllers/passwordResetController');

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', verifyResetToken);

// @route   PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', resetPassword);

module.exports = router;
