const mongoose = require('mongoose');

const communityMemberSchema = mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
        type: String,
        enum: ['owner', 'moderator', 'student'],
        default: 'student'
    },
    joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a user can only be in a community once
communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
