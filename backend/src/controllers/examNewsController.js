const asyncHandler = require('express-async-handler');
const ExamNews = require('../models/ExamNews');
const User = require('../models/User');

// @desc    Get exam news for user based on hashtags
// @route   GET /api/exam-news
// @access  Private
const getMyExamNews = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { examHashtags } = user;

    if (!examHashtags || examHashtags.length === 0) {
        return res.json([]);
    }

    // Fetch news that match at least one user hashtag
    const news = await ExamNews.find({
        status: 'published',
        hashtags: { $in: examHashtags }
    }).sort({ createdAt: -1 });

    res.json(news);
});

// @desc    Get all exam news (Admin)
// @route   GET /api/admin/exam-news
// @access  Private/Admin
const getAllExamNews = asyncHandler(async (req, res) => {
    const news = await ExamNews.find({}).sort({ createdAt: -1 });
    res.json(news);
});

// @desc    Create exam news
// @route   POST /api/admin/exam-news
// @access  Private/Admin
const createExamNews = asyncHandler(async (req, res) => {
    const { title, description, hashtags, status } = req.body;

    if (!title || !description || !hashtags || hashtags.length === 0) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    const news = await ExamNews.create({
        title,
        description,
        hashtags,
        status: status || 'published',
        createdBy: req.user._id
    });

    res.status(201).json(news);
});

// @desc    Update exam news
// @route   PUT /api/admin/exam-news/:id
// @access  Private/Admin
const updateExamNews = asyncHandler(async (req, res) => {
    const news = await ExamNews.findById(req.params.id);

    if (news) {
        news.title = req.body.title || news.title;
        news.description = req.body.description || news.description;
        news.hashtags = req.body.hashtags || news.hashtags;
        news.status = req.body.status || news.status;

        const updatedNews = await news.save();
        res.json(updatedNews);
    } else {
        res.status(404);
        throw new Error('News item not found');
    }
});

// @desc    Delete exam news
// @route   DELETE /api/admin/exam-news/:id
// @access  Private/Admin
const deleteExamNews = asyncHandler(async (req, res) => {
    const news = await ExamNews.findById(req.params.id);

    if (news) {
        await news.deleteOne();
        res.json({ message: 'Exam news removed' });
    } else {
        res.status(404);
        throw new Error('News item not found');
    }
});

// @desc    Record news view
// @route   POST /api/exam-news/:id/view
// @access  Private
const recordNewsView = asyncHandler(async (req, res) => {
    const news = await ExamNews.findById(req.params.id);

    if (news) {
        // Only add if user hasn't viewed it yet
        if (!news.views.includes(req.user._id)) {
            news.views.push(req.user._id);
            await news.save();
        }
        res.json({ message: 'View recorded', viewsCount: news.views.length });
    } else {
        res.status(404);
        throw new Error('News item not found');
    }
});

module.exports = {
    getMyExamNews,
    recordNewsView,
    getAllExamNews,
    createExamNews,
    updateExamNews,
    deleteExamNews
};
