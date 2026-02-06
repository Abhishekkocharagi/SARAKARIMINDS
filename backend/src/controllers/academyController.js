const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const MentorGroup = require('../models/MentorGroup');
// Note: We are reusing MentorGroup as 'Batch' for Academies for simplicity and consistency
// In UI we call them "Batches"

// @desc    Get academy dashboard stats
// @route   GET /api/academy/stats
// @access  Private/Academy
const getAcademyStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // 1. Total Inquiries: Count unique users who sent a message to this academy
    // Or just simple message count for now
    const totalInquiries = await Message.countDocuments({ recipient: req.user._id });

    // 2. Active Batches: Count active groups created by this academy
    const activeBatches = await MentorGroup.countDocuments({ mentor: req.user._id, status: 'active' });

    // 3. Page Reach: Sum of reactions + comments on academy posts
    const posts = await Post.find({ user: req.user._id });
    const postReach = posts.reduce((acc, post) => acc + post.reactions.length + post.comments.length, 0);

    // 4. Followers
    const followersCount = user.followers.length;

    // 5. Recent Enquiries (Last 3 messages)
    const recentEnquiries = await Message.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('sender', 'name profilePic');

    res.json({
        totalInquiries,
        activeBatches,
        postReach,
        followersCount,
        recentEnquiries
    });
});

// @desc    Post a new admission update or course announcement
// @route   POST /api/academy/post
// @access  Private/Academy
const createAcademyPost = asyncHandler(async (req, res) => {
    const { content, mediaUrl, mediaType, tags } = req.body;

    const post = await Post.create({
        user: req.user._id,
        content,
        mediaUrl,
        mediaType,
        tags,
        postType: 'academy_update'
    });

    res.status(201).json(post);
});

module.exports = {
    getAcademyStats,
    createAcademyPost
};
