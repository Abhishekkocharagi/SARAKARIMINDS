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

    // Mentor Application Details
    mentorApplication: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
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
            enum: ['none', 'pending', 'approved', 'rejected'],
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

    // Admin fields
    isBlocked: {
        type: Boolean,
        default: false
    },
    mentorApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    academyApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    examHashtags: [String]

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
