const mongoose = require('mongoose');

const communityPaymentSchema = mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proofImage: { type: String, required: true }, // URL to payment proof screenshot
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    transactionId: { type: String },
    amount: { type: Number },
    reviewedAt: { type: Date },
    rejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPayment', communityPaymentSchema);
