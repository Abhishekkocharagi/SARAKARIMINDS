const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({})
        .populate('user', 'name profilePic accountType exams')
        .populate('comments.user', 'name profilePic')
        .populate({
            path: 'originalPost',
            populate: { path: 'user', select: 'name profilePic accountType' }
        })
        .populate('mentions', 'name profilePic')
        .sort({ createdAt: -1 });
    res.json(posts);
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate('user', 'name profilePic accountType exams')
        .populate('comments.user', 'name profilePic')
        .populate({
            path: 'originalPost',
            populate: { path: 'user', select: 'name profilePic accountType' }
        })
        .populate('mentions', 'name profilePic');

    if (post) {
        res.json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    const { content, tags, mentions } = req.body;
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
        tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
        mentions: mentions ? (Array.isArray(mentions) ? mentions : JSON.parse(mentions)) : []
    });

    // ...

    // Handle Repost Logic
    if (req.body.originalPostId) {
        post.originalPost = req.body.originalPostId;
        post.isRepost = true;
    }

    const newlyCreatedPost = await post.save();

    // Notify mentioned users
    if (post.mentions && post.mentions.length > 0) {
        for (const mentionId of post.mentions) {
            if (mentionId.toString() !== req.user._id.toString()) {
                await createNotification(mentionId, req.user._id, 'mention', newlyCreatedPost._id);
            }
        }
    }

    // Notify original author if repost
    if (req.body.originalPostId) {
        // Increment share count on original post
        const originalPost = await Post.findByIdAndUpdate(req.body.originalPostId, { $inc: { shareCount: 1 } });

        // Notify original author if not self
        if (originalPost && originalPost.user.toString() !== req.user._id.toString()) {
            await createNotification(originalPost.user, req.user._id, 'share', newlyCreatedPost._id);
        }
    }

    // Populate user info for immediate frontend update
    const populatedPost = await Post.findById(newlyCreatedPost._id)
        .populate('user', 'name profilePic accountType exams')
        .populate({
            path: 'originalPost',
            populate: { path: 'user', select: 'name profilePic accountType' }
        })
        .populate('mentions', 'name profilePic');

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

        // Notify mentioned users in comment
        const mentions = text.match(/@[\w\s.-]+/g);
        if (mentions) {
            const User = require('../models/User');
            for (const mention of mentions) {
                const name = mention.substring(1).trim();
                const mentionedUser = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
                    await createNotification(mentionedUser._id, req.user._id, 'mention', post._id);
                }
            }
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
        .populate({
            path: 'originalPost',
            populate: { path: 'user', select: 'name profilePic accountType' }
        })
        .populate('mentions', 'name profilePic')
        .sort({ createdAt: -1 });
    res.json(posts);
});

// @desc    Update user's last feed visit timestamp
// @route   PUT /api/posts/last-visit
// @access  Private
const updateLastFeedVisit = asyncHandler(async (req, res) => {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { lastFeedVisit: new Date() });
    res.json({ message: 'Last feed visit updated' });
});

const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (post) {
        if (post.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to delete this post');
        }
        await post.deleteOne();
        res.json({ message: 'Post removed' });
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});



// @desc    Toggle save post
// @route   POST /api/posts/:id/save
// @access  Private
const toggleSavePost = asyncHandler(async (req, res) => {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const postId = req.params.id;

    if (user.savedPosts.includes(postId)) {
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
        await user.save();
        res.json({ isSaved: false });
    } else {
        user.savedPosts.push(postId);
        await user.save();
        res.json({ isSaved: true });
    }
});

// @desc    Get saved posts
// @route   GET /api/posts/saved/all
// @access  Private
const getSavedPosts = asyncHandler(async (req, res) => {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate({
        path: 'savedPosts',
        populate: [
            { path: 'user', select: 'name profilePic accountType exams' },
            { path: 'comments.user', select: 'name profilePic' }
        ]
    });

    res.json(user.savedPosts);
});

// @desc    Delete a comment
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const commentIndex = post.comments.findIndex(
        c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
        res.status(404);
        throw new Error('Comment not found');
    }

    const comment = post.comments[commentIndex];

    // Allow deletion if user is comment author OR post owner
    if (
        comment.user.toString() !== req.user._id.toString() &&
        post.user.toString() !== req.user._id.toString()
    ) {
        res.status(401);
        throw new Error('Not authorized to delete this comment');
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'name profilePic');
    res.json(updatedPost.comments);
});

module.exports = {
    getPosts,
    createPost,
    likePost,
    commentPost,
    getUserPosts,
    updateLastFeedVisit,
    deletePost,
    toggleSavePost,
    getSavedPosts,
    getPostById,
    deleteComment
};
