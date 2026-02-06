const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('sender', 'name profilePic')
        .populate({
            path: 'post',
            select: 'content mediaUrl'
        })
        .populate({
            path: 'story',
            select: 'content mediaUrl mediaType'
        })
        .sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );
    res.json({ message: 'Notifications marked as read' });
});

const markSingleAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Marked as read' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Get unread counts for badges
// @route   GET /api/notifications/unread-counts
// @access  Private
const Message = require('../models/Message');
const Connection = require('../models/Connection');

const getUnreadCounts = asyncHandler(async (req, res) => {
    const Post = require('../models/Post');
    // Count distinct senders for unread messages
    const unreadMessageSenders = await Message.distinct('sender', {
        recipient: req.user._id,
        isRead: false
    });
    const unreadMessages = unreadMessageSenders.length || 0;

    // pendingConnections must be where recipient is current user and status is pending AND isSeen is false
    const pendingConnectionsCount = await Connection.countDocuments({
        recipient: req.user._id,
        status: 'pending',
        isSeen: false
    });

    const unreadNotifications = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    }) || 0;

    // Feed dot logic: Are there any new posts since user last visit the feed?
    const lastFeedVisit = req.user.lastFeedVisit || new Date(0);
    const hasNewPosts = await Post.exists({
        user: { $ne: req.user._id },
        createdAt: { $gt: lastFeedVisit }
    });

    res.json({
        messages: unreadMessages,
        connections: pendingConnectionsCount,
        notifications: unreadNotifications,
        hasNewPosts: !!hasNewPosts
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    markSingleAsRead,
    getUnreadCounts
};
