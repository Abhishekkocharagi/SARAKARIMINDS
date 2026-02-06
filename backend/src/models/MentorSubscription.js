const mongoose = require('mongoose');

const mentorSubscriptionSchema = mongoose.Schema({
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const MentorSubscription = mongoose.model('MentorSubscription', mentorSubscriptionSchema);
module.exports = MentorSubscription;
