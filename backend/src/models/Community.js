const mongoose = require('mongoose');

const communitySchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g. KAS, PSI, etc.
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['free', 'paid'], default: 'free' },
    price: { type: Number, default: 0 },
    paymentQr: { type: String }, // URL to payment QR image
    coverImage: { type: String }, // URL to community cover image
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'active'
    },
    memberCount: { type: Number, default: 1 },
    rules: { type: String }
}, { timestamps: true });

communitySchema.index({ category: 1 });

module.exports = mongoose.model('Community', communitySchema);
