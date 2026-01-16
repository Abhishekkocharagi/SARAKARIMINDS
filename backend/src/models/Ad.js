const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    redirectUrl: {
        type: String,
        required: true
    },
    slot: {
        type: String,
        enum: ['FEED_INLINE', 'SIDEBAR_EXAM'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
