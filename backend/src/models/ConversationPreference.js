const mongoose = require('mongoose');

const conversationPreferenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isStarred: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isFocused: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    label: { type: String, enum: ['General', 'Jobs', 'Personal'], default: 'General' }
}, {
    timestamps: true
});

// Ensure unique preference per user-target pair
conversationPreferenceSchema.index({ user: 1, targetUser: 1 }, { unique: true });

const ConversationPreference = mongoose.model('ConversationPreference', conversationPreferenceSchema);

module.exports = ConversationPreference;
