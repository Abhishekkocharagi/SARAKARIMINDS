const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorGroup' }, // For Private Group Posts
    content: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String }, // 'image' or 'pdf'
    postType: {
        type: String,
        enum: ['regular', 'mentor_insight', 'academy_update'],
        default: 'regular'
    },
    tags: [{ type: String }], // Exam tags like 'KAS', 'PSI'
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: {
            type: String,
            enum: ['like', 'celebrate', 'support', 'love', 'insightful', 'funny'],
            default: 'like'
        }
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    isRepost: { type: Boolean, default: false },
    shareCount: { type: Number, default: 0 }
}, { timestamps: true });

postSchema.index({ tags: 1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
