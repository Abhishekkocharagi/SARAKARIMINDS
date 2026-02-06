const mongoose = require('mongoose');

const groupMembershipSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'MentorGroup'
    },
    paymentStatus: {
        type: String,
        enum: ['active', 'expired', 'pending'],
        default: 'pending'
    },
    amountPaid: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date
    },
    transactionId: {
        type: String
    }
}, {
    timestamps: true
});

// Prevent duplicate active memberships
groupMembershipSchema.index({ user: 1, group: 1, paymentStatus: 1 }, { unique: true });

const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema);
module.exports = GroupMembership;
