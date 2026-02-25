const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all topics of the day
// @route   GET /api/topic-of-the-day
// @access  Private
const getTopicsOfTheDay = asyncHandler(async (req, res) => {
    // 1. Find the special account
    let topicUser = await User.findOne({ email: 'arunpalled2201@gmail.com' });

    // 2. If it doesn't exist, create it automatically
    if (!topicUser) {
        topicUser = await User.create({
            name: 'Topic of the Day',
            email: 'arunpalled2201@gmail.com',
            password: 'Arunp@123',
            accountType: 'Mentor',
            role: 'admin',
            isVerified: true,
            about: 'Official Topic of the Day account managed by Arun Palled.'
        });
    }

    // 3. Fetch all posts by this user
    const posts = await Post.find({ user: topicUser._id })
        .populate('user', 'name profilePic')
        .sort({ createdAt: -1 });

    res.json(posts);
});

module.exports = {
    getTopicsOfTheDay
};
