const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'mentor', 'academy', 'admin'],
        default: 'student'
    },
    accountType: {
        type: String, // 'Aspirant', 'Mentor', 'Academy' - kept for backward compatibility and display
        default: 'Aspirant'
    },
    profilePic: {
        type: String,
        default: ''
    },
    coverPic: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    exams: [String], // For students/mentors
    experience: String, // For mentors
    expertise: [String], // For mentors

    // Mentor Monetization
    mentorshipEnabled: { type: Boolean, default: false },
    mentorshipPrice: { type: Number, default: 0 },
    mentorEarnings: { type: Number, default: 0 },
    availabilitySlots: [{
        day: String,
        startTime: String,
        endTime: String,
        isBooked: { type: Boolean, default: false },
        bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Mentor Application Details
    mentorApplication: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected', 'revoked'],
            default: 'none'
        },
        appliedAt: Date,
        reviewedAt: Date,
        documents: [String] // URLs to verification docs
    },

    // Academy Application Details
    academyDetails: {
        academyName: String,
        location: String,
        website: String,
        description: String
    },
    academyApplication: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected', 'revoked'],
            default: 'none'
        },
        appliedAt: Date,
        reviewedAt: Date,
        documents: [String]
    },

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    recentSearches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Auth & Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    isBot: {
        type: Boolean,
        default: false
    },
    botType: String,

    isVerified: {
        type: Boolean,
        default: false
    },
    verificationApprovedAt: Date,

    // Admin fields
    isBlocked: {
        type: Boolean,
        default: false
    },
    mentorApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected', 'revoked'],
        default: 'none'
    },
    academyApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected', 'revoked'],
        default: 'none'
    },
    examHashtags: [String],
    language: {
        type: String,
        enum: ['en', 'kn', 'hi'],
        default: 'en'
    },
    preferredExams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    receiveAllNotifications: {
        type: Boolean,
        default: false
    },
    notificationPreferences: {
        emailDigest: { type: Boolean, default: true },
        postLikes: { type: Boolean, default: true },
        postComments: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        connectionRequests: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        messages: { type: Boolean, default: true }
    },

    // Dual Streak System
    dailyQuizStreakCount: {
        type: Number,
        default: 0
    },
    lastDailyQuizAttemptDate: {
        type: Date
    },
    dailyGameStreakCount: {
        type: Number,
        default: 0
    },
    lastDailyGameAttemptDate: {
        type: Date
    },
    lastFeedVisit: {
        type: Date,
        default: Date.now
    },

    // Account Deletion Grace Period
    deletionRequestedAt: {
        type: Date
    },
    scheduledDeletionDate: {
        type: Date
    }

}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
