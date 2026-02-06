const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Exam = require('../models/Exam');
const generateToken = require('../utils/generateToken');
const { sendEmailOTP, sendSMSOTP } = require('../utils/otpService');

// @desc    Send OTP to email and/or mobile
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { email, mobile } = req.body;

    if (!email && !mobile) {
        res.status(400);
        throw new Error('Please provide an email or mobile number for verification');
    }

    // Check if user already exists
    if (email) {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists with this email');
        }
    }

    if (mobile) {
        const mobileExists = await User.findOne({ mobile });
        if (mobileExists) {
            res.status(400);
            throw new Error('User already exists with this mobile number');
        }
    }

    // Rate limiting: 60s cooldown for this recipient
    const existingOTP = await OTP.findOne({ $or: [{ email }, { mobile }] });
    if (existingOTP) {
        const diff = (new Date() - existingOTP.createdAt) / 1000;
        if (diff < 60) {
            res.status(429);
            throw new Error(`Please wait ${Math.round(60 - diff)}s before requesting a new code.`);
        }
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store/Update OTP in DB
    await OTP.findOneAndUpdate(
        { $or: [email ? { email } : null, mobile ? { mobile } : null].filter(Boolean) },
        { email, mobile, otp, createdAt: new Date() },
        { upsert: true, new: true }
    );

    let emailSent = false;
    let smsSent = false;

    // Send OTP via Email if provided
    if (email) {
        const emailResult = await sendEmailOTP(email, otp);
        emailSent = emailResult.success;
    }

    // Send OTP via SMS if provided
    if (mobile) {
        const smsResult = await sendSMSOTP(mobile, otp);
        smsSent = smsResult.success;
    }

    if (emailSent || smsSent) {
        res.status(200).json({
            success: true,
            message: `Verification code sent to ${email ? 'email' : ''} ${email && mobile ? 'and' : ''} ${mobile ? 'mobile' : ''}`
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code. Please try again.'
        });
    }
});

// @desc    Verify OTP and Register User
// @route   POST /api/auth/verify-register
// @access  Public
const verifyAndRegister = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        mobile,
        password,
        otp
    } = req.body;

    // Validate inputs
    if (!name || (!email && !mobile) || !password || !otp) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    // Strong Password Enforcement (Strict)
    // Minimum 6 characters, at least 1 letter
    const passwordRegex = /^(?=.*[a-zA-Z]).{6,}$/;
    if (!passwordRegex.test(password)) {
        res.status(400);
        throw new Error('Password must be minimum 6 characters and contain at least 1 letter.');
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
        $or: [
            email ? { email } : null,
            mobile ? { mobile } : null
        ].filter(Boolean),
        otp
    });


    if (!otpRecord) {
        res.status(400);
        throw new Error('Invalid or expired verification code');
    }

    // Preferred Exams Validation
    const preferredExams = req.body.preferredExams || [];
    if (preferredExams.length === 0 || preferredExams.length > 5) {
        res.status(400);
        throw new Error('Please select between 1 and 5 preferred exams.');
    }

    // Sync with legacy fields
    const selectedExamsData = await Exam.find({ _id: { $in: preferredExams } });
    const examNames = selectedExamsData.map(e => e.name);

    // Force default role as 'student' and accountType as 'Aspirant'
    const userData = {
        name,
        email,
        mobile: mobile || '',
        password,
        role: 'student',
        accountType: 'Aspirant',
        about: req.body.about || '',
        exams: examNames,
        examHashtags: examNames,
        preferredExams,
        mentorApplicationStatus: 'none',
        academyApplicationStatus: 'none'
    };

    // Create user
    const user = await User.create(userData);

    // Clean up OTP record
    await OTP.findByIdAndDelete(otpRecord._id);

    if (user) {
        const fullUser = await User.findById(user._id).populate('preferredExams', 'name fullName category');
        res.status(201).json({
            _id: fullUser._id,
            name: fullUser.name,
            email: fullUser.email,
            role: fullUser.role,
            accountType: fullUser.accountType,
            token: generateToken(fullUser._id),
            exams: fullUser.exams,
            preferredExams: fullUser.preferredExams,
            message: 'Account created successfully'
        });
    } else {
        res.status(400);
        throw new Error('Failed to create account');
    }
});

module.exports = { sendOTP, verifyAndRegister };

