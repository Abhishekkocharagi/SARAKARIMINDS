const mongoose = require('mongoose');

const campaignSchema = mongoose.Schema({
    academy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['profile_boost', 'post_boost', 'banner_ad'],
        required: true
    },
    targetExams: [{
        type: String // e.g., 'KAS', 'PSI'
    }],
    targetLocation: {
        state: String,
        district: String
    },
    budget: {
        type: Number,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'paused', 'completed'],
        default: 'pending'
    },
    rejectionReason: String,

    // Performance Stats
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    leads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], // Users who clicked 'Interested' or 'Apply'

    adContent: {
        title: String,
        description: String,
        mediaUrl: String,
        link: String
    }
}, {
    timestamps: true
});

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;
