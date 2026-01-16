const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({})
        .populate('user', 'name profilePic accountType exams')
        .populate('comments.user', 'name profilePic')
        .sort({ createdAt: -1 });
    res.json(posts);
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    const { content, tags } = req.body;
    let mediaUrl = '';
    let mediaType = '';

    if (req.file) {
        mediaUrl = req.file.path;
        mediaType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
    }

    if (!content && !mediaUrl) {
        res.status(400);
        throw new Error('Please provide either text content or a media file');
    }

    const post = new Post({
        user: req.user._id,
        content: content || '',
        mediaUrl,
        mediaType,
        tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []
    });

    const createdPost = await post.save();
    // Populate user info for immediate frontend update
    const populatedPost = await Post.findById(createdPost._id).populate('user', 'name profilePic accountType exams');
    res.status(201).json(populatedPost);
});

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const { createNotification } = require('../utils/notificationHelper');

const likePost = asyncHandler(async (req, res) => {
    const { type = 'like' } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
        const existingReactionIndex = post.reactions.findIndex(
            r => r.user.toString() === req.user._id.toString()
        );

        if (existingReactionIndex > -1) {
            if (post.reactions[existingReactionIndex].type === type) {
                // Remove if same type (Toggle off)
                post.reactions.splice(existingReactionIndex, 1);
            } else {
                // Update to new reaction type
                post.reactions[existingReactionIndex].type = type;
            }
        } else {
            // Add new reaction
            post.reactions.push({ user: req.user._id, type });

            // Notify author if not self
            if (post.user.toString() !== req.user._id.toString()) {
                await createNotification(post.user, req.user._id, 'like', post._id);
            }
        }

        await post.save();
        res.json(post.reactions);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentPost = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
        const comment = {
            user: req.user._id,
            text,
            createdAt: new Date()
        };
        post.comments.push(comment);
        await post.save();

        // Notify author if not self
        if (post.user.toString() !== req.user._id.toString()) {
            await createNotification(post.user, req.user._id, 'comment', post._id);
        }

        const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'name profilePic');
        res.status(201).json(updatedPost.comments);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Get posts for a specific user
// @route   GET /api/posts/user/:userId
// @access  Private
const getUserPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ user: req.params.userId })
        .populate('user', 'name profilePic accountType exams')
        .populate('comments.user', 'name profilePic')
        .sort({ createdAt: -1 });
    res.json(posts);
});

module.exports = {
    getPosts,
    createPost,
    likePost,
    commentPost,
    getUserPosts
};
