const mongoose = require('mongoose');

const mentorGroupSchema = mongoose.Schema({
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    examCategory: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    isPaid: {
        type: Boolean,
        default: true
    },
    paymentType: {
        type: String,
        enum: ['monthly', 'one-time'],
        default: 'monthly'
    },
    maxMembers: {
        type: Number,
        default: 100
    },
    memberCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'disabled', 'archived'],
        default: 'active'
    },
    groupIcon: {
        type: String,
        default: ''
    },
    paymentQrImage: {
        type: String, // URL to uploaded QR code
        default: ''
    }
}, {
    timestamps: true
});

const MentorGroup = mongoose.model('MentorGroup', mentorGroupSchema);
module.exports = MentorGroup;
