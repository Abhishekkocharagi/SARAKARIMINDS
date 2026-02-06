const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');
const MentorGroup = require('../models/MentorGroup');
const GroupMembership = require('../models/GroupMembership');
const Post = require('../models/Post');

// @desc    Get Sales & Growth Dashboard Metrics
// @route   GET /api/analytics/sales-dashboard
// @access  Private/Admin
const getSalesDashboardStats = asyncHandler(async (req, res) => {
    const { timeframe = '30', examId } = req.query;
    const days = parseInt(timeframe);
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const previousStartDate = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // 1. MAU (Monthly Active Users)
    // Definition: Count of unique users who logged in OR viewed feed OR received notification in last 30 days
    // We'll use 'updatedAt' as a proxy for activity, plus 'lastFeedVisit'
    const currentMAUCount = await User.countDocuments({
        $or: [
            { updatedAt: { $gte: startDate } },
            { lastFeedVisit: { $gte: startDate } }
        ]
    });

    const previousMAUCount = await User.countDocuments({
        $or: [
            { updatedAt: { $gte: previousStartDate, $lt: startDate } },
            { lastFeedVisit: { $gte: previousStartDate, $lt: startDate } }
        ]
    });

    const mauGrowth = previousMAUCount === 0 ? 100 : Math.round(((currentMAUCount - previousMAUCount) / previousMAUCount) * 100);

    // MAU Line Chart (Last 6 months)
    const mauTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

        const count = await User.countDocuments({
            $or: [
                { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } },
                { lastFeedVisit: { $gte: startOfMonth, $lte: endOfMonth } }
            ]
        });
        mauTrend.push({
            month: startOfMonth.toLocaleString('default', { month: 'short' }),
            users: count
        });
    }

    // 2. Exam-wise Distribution
    // Show how many users selected each exam
    const exams = await Exam.find({});
    const examDistribution = await Promise.all(exams.map(async (exam) => {
        const count = await User.countDocuments({ preferredExams: exam._id });
        return {
            id: exam._id,
            name: exam.name,
            count
        };
    }));

    const totalUsersWithExams = examDistribution.reduce((acc, curr) => acc + curr.count, 0);
    const examDistributionFormatted = examDistribution.map(item => ({
        ...item,
        percentage: totalUsersWithExams === 0 ? 0 : Math.round((item.count / totalUsersWithExams) * 100)
    })).sort((a, b) => b.count - a.count);

    // 3. Notification Reach
    // Track sent, delivered, clicked
    const notificationQuery = { createdAt: { $gte: startDate } };
    if (examId) {
        // Find users who prefer this exam
        const usersInExam = await User.find({ preferredExams: examId }).select('_id');
        const userIds = usersInExam.map(u => u._id);
        notificationQuery.recipient = { $in: userIds };
    }

    const totalNotifications = await Notification.countDocuments(notificationQuery);
    const readNotifications = await Notification.countDocuments({ ...notificationQuery, isRead: true });

    // Simplistic reach %: (read / total)
    const reachRate = totalNotifications === 0 ? 0 : Math.round((readNotifications / totalNotifications) * 100);

    // 4. Community Engagement
    const totalCommunities = await MentorGroup.countDocuments({ status: 'active' });
    const paidCommunities = await MentorGroup.countDocuments({ status: 'active', isPaid: true });
    const freeCommunities = await MentorGroup.countDocuments({ status: 'active', isPaid: false });

    // Active communities: posts in last 7 days
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const activeCommunityIds = await Post.distinct('group', {
        group: { $exists: true, $ne: null },
        createdAt: { $gte: sevenDaysAgo }
    });
    const activeCommunitiesCount = activeCommunityIds.length;

    const totalMemberships = await GroupMembership.countDocuments({ paymentStatus: 'active' });

    // Top 5 active communities (by post count in last 7 days)
    const topCommunities = await Post.aggregate([
        { $match: { group: { $exists: true, $ne: null }, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$group', postCount: { $sum: 1 } } },
        { $sort: { postCount: -1 } },
        { $limit: 5 }
    ]);

    const topCommunitiesPopulated = await Promise.all(topCommunities.map(async (item) => {
        const group = await MentorGroup.findById(item._id).select('name');
        return {
            name: group ? group.name : 'Unknown',
            posts: item.postCount
        };
    }));

    // 5. Sample Leads (Anonymized)
    const leadQuery = { role: 'student' };
    if (examId) {
        leadQuery.preferredExams = examId;
    }

    const sampleUsers = await User.find(leadQuery)
        .populate('preferredExams', 'name')
        .sort({ updatedAt: -1 })
        .limit(20);

    const sampleLeads = sampleUsers.map(u => {
        const lastActive = u.updatedAt;
        const diffDays = Math.ceil((now - lastActive) / (1000 * 60 * 60 * 24));
        let engagement = 'Low';
        if (diffDays <= 3) engagement = 'High';
        else if (diffDays <= 7) engagement = 'Medium';

        return {
            exam: u.preferredExams.length > 0 ? u.preferredExams[0].name : 'N/A',
            city: u.academyDetails?.location || 'Unknown', // Reusing location if available or just Unknown
            engagement,
            lastActiveDate: lastActive.toISOString().split('T')[0]
        };
    });

    res.json({
        mau: {
            total: currentMAUCount,
            growth: mauGrowth,
            trend: mauTrend
        },
        examDistribution: examDistributionFormatted,
        notificationReach: {
            total: totalNotifications,
            read: readNotifications,
            reachRate
        },
        community: {
            total: totalCommunities,
            active: activeCommunitiesCount,
            paid: paidCommunities,
            free: freeCommunities,
            totalMembers: totalMemberships,
            topCommunities: topCommunitiesPopulated
        },
        sampleLeads
    });
});

module.exports = {
    getSalesDashboardStats
};
