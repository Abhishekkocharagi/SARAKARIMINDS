const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    email: { type: String },
    mobile: { type: String },
    otp: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 5 minutes
    }
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;

