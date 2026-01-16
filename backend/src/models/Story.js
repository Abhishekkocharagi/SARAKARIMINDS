const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    content: { type: String },
    mediaUrl: { type: String }, // Renamed from image
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, default: '❤️' }
    }],
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000), // 24 hours from now
        index: { expires: 0 } // TTL index
    }
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);
module.exports = Story;
