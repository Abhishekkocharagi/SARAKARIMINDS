const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const Notification = require('../models/Notification');
const MentorGroup = require('../models/MentorGroup');
const AdminLog = require('../models/AdminLog');
const GroupMembership = require('../models/GroupMembership');

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
    user.isVerified = true;
    user.verificationApprovedAt = new Date();

    if (user.mentorApplication) {
        user.mentorApplication.status = 'approved';
        user.mentorApplication.reviewedAt = new Date();
    }
    await user.save();

    // Send Notification
    await Notification.create({
        recipient: user._id,
        sender: req.user._id, // Admin
        type: 'system',
        message: 'Your account has been verified as Mentor! You now have access to the Mentor Dashboard.'
    });

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

    // Send Notification
    await Notification.create({
        recipient: user._id,
        sender: req.user._id, // Admin
        type: 'system',
        message: 'Your mentor verification request was rejected. You may reapply.'
    });

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
    user.isVerified = true;
    user.verificationApprovedAt = new Date();

    if (user.academyApplication) {
        user.academyApplication.status = 'approved';
        user.academyApplication.reviewedAt = new Date();
    }
    await user.save();

    // Send Notification
    await Notification.create({
        recipient: user._id,
        sender: req.user._id, // Admin
        type: 'system',
        message: 'Your account has been verified as Academy! You now have access to the Academy Dashboard.'
    });

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

    // Send Notification
    await Notification.create({
        recipient: user._id,
        sender: req.user._id, // Admin
        type: 'system',
        message: 'Your academy verification request was rejected. You may reapply.'
    });

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
        user.isVerified = true; // FIX: Ensure verification
        user.verificationApprovedAt = new Date();
        user.mentorApplication.status = 'approved';
        user.mentorApplication.reviewedAt = new Date();
    } else if (type === 'academy') {
        user.role = 'academy';
        user.accountType = 'Academy';
        user.academyApplicationStatus = 'approved';
        user.isVerified = true; // FIX: Ensure verification
        user.verificationApprovedAt = new Date();
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

// @desc    Get all verified mentors and academies
// @route   GET /api/admin/verified-users
// @access  Private/Admin
const getVerifiedUsers = asyncHandler(async (req, res) => {
    const users = await User.find({
        role: { $in: ['mentor', 'academy'] },
        $or: [
            { mentorApplicationStatus: 'approved' },
            { academyApplicationStatus: 'approved' }
        ]
    }).select('name email mobile role verificationApprovedAt isBlocked mentorApplicationStatus academyApplicationStatus');

    // Add community counts
    const usersWithStats = await Promise.all(users.map(async (u) => {
        const communityCount = await MentorGroup.countDocuments({ mentor: u._id });
        const paidCommunityCount = await MentorGroup.countDocuments({ mentor: u._id, isPaid: true });
        return {
            ...u.toObject(),
            communityCount,
            paidCommunityCount
        };
    }));

    res.json(usersWithStats);
});

// @desc    Get verified user details
// @route   GET /api/admin/verified-users/:userId
// @access  Private/Admin
const getVerifiedUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const groups = await MentorGroup.find({ mentor: user._id });
    const memberships = await GroupMembership.find({
        group: { $in: groups.map(g => g._id) }
    }).populate('user', 'name email').sort({ createdAt: -1 });

    const stats = {
        totalCommunities: groups.length,
        paidCommunities: groups.filter(g => g.isPaid).length,
        totalEarnings: memberships.filter(m => m.paymentStatus === 'active').reduce((acc, m) => acc + (m.amountPaid || 0), 0)
    };

    res.json({
        user,
        communities: groups, // Frontend uses 'communities' key
        payments: memberships, // Frontend uses 'payments' key
        stats
    });
});

// @desc    Revoke mentor/academy verification
// @route   PUT /api/admin/verified-users/revoke/:userId
// @access  Private/Admin
const revokeVerification = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const previousRole = user.role;
    user.role = 'student';
    user.accountType = 'Aspirant';
    user.isVerified = false;

    if (user.mentorApplicationStatus === 'approved') {
        user.mentorApplicationStatus = 'revoked';
        if (user.mentorApplication) {
            user.mentorApplication.status = 'revoked';
        }
    }

    if (user.academyApplicationStatus === 'approved') {
        user.academyApplicationStatus = 'revoked';
        if (user.academyApplication) {
            user.academyApplication.status = 'revoked';
        }
    }

    await user.save();

    // Log the action
    await AdminLog.create({
        admin: req.user._id,
        action: 'REVOKE_VERIFICATION',
        targetUser: user._id,
        details: `Revoked ${previousRole} verification. Previous role: ${previousRole}`,
        reason: reason || 'No reason provided'
    });

    // Notify user
    await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: 'system',
        message: `Verification Revoked: Your ${previousRole} verification has been removed by admin. Reason: ${reason || 'Not specified'}. You can continue using the platform as a student.`
    });

    // Archive groups
    await MentorGroup.updateMany(
        { mentor: user._id },
        { status: 'archived' }
    );

    res.json({ message: 'Verification revoked successfully' });
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
    rejectApplication,
    getVerifiedUsers,
    getVerifiedUserDetails,
    revokeVerification
};
