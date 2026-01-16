const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalStories = await Story.countDocuments();
    const pendingMentors = await User.countDocuments({ mentorApplicationStatus: 'pending' });
    const pendingAcademies = await User.countDocuments({ academyApplicationStatus: 'pending' });

    res.json({
        stats: {
            totalUsers,
            totalPosts,
            totalStories,
            pendingMentors,
            pendingAcademies
        }
    });
});

// @desc    Get pending mentor applications
// @route   GET /api/admin/mentors/pending
// @access  Private/Admin
const getPendingMentors = asyncHandler(async (req, res) => {
    const mentors = await User.find({ mentorApplicationStatus: 'pending' })
        .select('name email mobile mentorApplication experience expertise createdAt');
    res.json(mentors);
});

// @desc    Get pending academy applications
// @route   GET /api/admin/academies/pending
// @access  Private/Admin
const getPendingAcademies = asyncHandler(async (req, res) => {
    const academies = await User.find({ academyApplicationStatus: 'pending' })
        .select('name email mobile academyApplication academyDetails createdAt');
    res.json(academies);
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Block a user
// @route   PUT /api/admin/users/block/:userId
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.isBlocked = true;
    await user.save();
    res.json({ message: 'User blocked successfully' });
});

// @desc    Unblock a user
// @route   PUT /api/admin/users/unblock/:userId
// @access  Private/Admin
const unblockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.isBlocked = false;
    await user.save();
    res.json({ message: 'User unblocked successfully' });
});

// @desc    Approve mentor application
// @route   PUT /api/admin/mentors/approve/:userId
// @access  Private/Admin
const approveMentor = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.role = 'mentor';
    user.accountType = 'Mentor';
    user.mentorApplicationStatus = 'approved';
    if (user.mentorApplication) {
        user.mentorApplication.status = 'approved';
        user.mentorApplication.reviewedAt = new Date();
    }
    await user.save();
    res.json({ message: 'Mentor application approved' });
});

// @desc    Reject mentor application
// @route   PUT /api/admin/mentors/reject/:userId
// @access  Private/Admin
const rejectMentor = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.mentorApplicationStatus = 'rejected';
    if (user.mentorApplication) {
        user.mentorApplication.status = 'rejected';
        user.mentorApplication.reviewedAt = new Date();
    }
    await user.save();
    res.json({ message: 'Mentor application rejected' });
});

// @desc    Approve academy application
// @route   PUT /api/admin/academies/approve/:userId
// @access  Private/Admin
const approveAcademy = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.role = 'academy';
    user.accountType = 'Academy';
    user.academyApplicationStatus = 'approved';
    if (user.academyApplication) {
        user.academyApplication.status = 'approved';
        user.academyApplication.reviewedAt = new Date();
    }
    await user.save();
    res.json({ message: 'Academy application approved' });
});

// @desc    Reject academy application
// @route   PUT /api/admin/academies/reject/:userId
// @access  Private/Admin
const rejectAcademy = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.academyApplicationStatus = 'rejected';
    if (user.academyApplication) {
        user.academyApplication.status = 'rejected';
        user.academyApplication.reviewedAt = new Date();
    }
    await user.save();
    res.json({ message: 'Academy application rejected' });
});

// @desc    Get all content (posts)
// @route   GET /api/admin/content
// @access  Private/Admin
const getAllContent = asyncHandler(async (req, res) => {
    const posts = await Post.find().populate('user', 'name email');
    res.json(posts);
});

// @desc    Delete content
// @route   DELETE /api/admin/content/:postId
// @access  Private/Admin
const deleteContent = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    await post.deleteOne();
    res.json({ message: 'Post removed' });
});

// @desc    Get all pending mentor and academy applications (Legacy)
// @route   GET /api/admin/applications
// @access  Private/Admin
const getPendingApplications = asyncHandler(async (req, res) => {
    const mentors = await User.find({ 'mentorApplication.status': 'pending' })
        .select('name email mobile mentorApplication experience expertise createdAt');

    const academies = await User.find({ 'academyApplication.status': 'pending' })
        .select('name email mobile academyApplication academyDetails createdAt');

    res.json({
        mentors,
        academies
    });
});

// @desc    Approve an application (Legacy)
// @route   PUT /api/admin/approve/:id
// @access  Private/Admin
const approveApplication = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'mentor' or 'academy'
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (type === 'mentor') {
        user.role = 'mentor';
        user.accountType = 'Mentor';
        user.mentorApplicationStatus = 'approved';
        user.mentorApplication.status = 'approved';
        user.mentorApplication.reviewedAt = new Date();
    } else if (type === 'academy') {
        user.role = 'academy';
        user.accountType = 'Academy';
        user.academyApplicationStatus = 'approved';
        user.academyApplication.status = 'approved';
        user.academyApplication.reviewedAt = new Date();
    } else {
        res.status(400);
        throw new Error('Invalid application type');
    }

    await user.save();
    res.json({ message: 'Application approved successfully', user });
});

// @desc    Reject an application (Legacy)
// @route   PUT /api/admin/reject/:id
// @access  Private/Admin
const rejectApplication = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (type === 'mentor') {
        user.mentorApplicationStatus = 'rejected';
        user.mentorApplication.status = 'rejected';
        user.mentorApplication.reviewedAt = new Date();
    } else if (type === 'academy') {
        user.academyApplicationStatus = 'rejected';
        user.academyApplication.status = 'rejected';
        user.academyApplication.reviewedAt = new Date();
    } else {
        res.status(400);
        throw new Error('Invalid application type');
    }

    await user.save();
    res.json({ message: 'Application rejected', user });
});

module.exports = {
    getStats,
    getPendingMentors,
    getPendingAcademies,
    getAllUsers,
    blockUser,
    unblockUser,
    approveMentor,
    rejectMentor,
    approveAcademy,
    rejectAcademy,
    getAllContent,
    deleteContent,
    getPendingApplications,
    approveApplication,
    rejectApplication
};
