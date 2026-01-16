const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    content: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String }, // 'image' or 'pdf'
    tags: [{ type: String }], // Exam tags like 'KAS', 'PSI'
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
    }]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
