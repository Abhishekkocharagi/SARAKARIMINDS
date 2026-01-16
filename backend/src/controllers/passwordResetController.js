const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer').default || require('nodemailer');

// Configure email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    console.log('Forgot password request received:', req.body);
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('No account found with that email address');
    }

    console.log('User found:', user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire time (1 hour)
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #0a66c2; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">SarkariMinds</h1>
            </div>
            <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #666; line-height: 1.6;">Hi ${user.name},</p>
                <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #0a66c2; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; line-height: 1.6;">Or copy and paste this link into your browser:</p>
                <p style="color: #0a66c2; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">This link will expire in 1 hour.</p>
                <p style="color: #666; line-height: 1.6;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2026 SarkariMinds. All rights reserved.</p>
            </div>
        </div>
    `;

    try {
        console.log('Creating email transporter...');
        console.log('Email config - User:', process.env.EMAIL_USER);
        console.log('Reset URL:', resetUrl);

        const transporter = createTransporter();

        console.log('Attempting to send email to:', user.email);

        await transporter.sendMail({
            from: `"SarkariMinds" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request - SarkariMinds',
            html: message
        });

        console.log('✅ Email sent successfully!');

        res.json({
            success: true,
            message: 'Password reset email sent successfully. Please check your inbox.'
        });
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
});

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
const verifyResetToken = asyncHandler(async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset token');
    }

    res.json({
        success: true,
        message: 'Token is valid',
        email: user.email
    });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    const confirmMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #0a66c2; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">SarkariMinds</h1>
            </div>
            <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Password Changed Successfully</h2>
                <p style="color: #666; line-height: 1.6;">Hi ${user.name},</p>
                <p style="color: #666; line-height: 1.6;">Your password has been successfully changed.</p>
                <p style="color: #666; line-height: 1.6;">If you did not make this change, please contact our support team immediately.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/login" style="background-color: #0a66c2; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login Now</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2026 SarkariMinds. All rights reserved.</p>
            </div>
        </div>
    `;

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"SarkariMinds" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Changed Successfully - SarkariMinds',
            html: confirmMessage
        });
    } catch (error) {
        console.error('Confirmation email error:', error);
    }

    res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
    });
});

module.exports = {
    forgotPassword,
    verifyResetToken,
    resetPassword
};
