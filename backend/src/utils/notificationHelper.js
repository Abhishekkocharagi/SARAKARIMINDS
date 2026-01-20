const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (recipientId, senderId, type, postId = null, storyId = null) => {
    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) return;

        // Check user preferences (assuming reactions/replies follow likes/comments prefs for now)
        const prefs = recipient.notificationPreferences || {};
        if ((type === 'like' || type === 'story_reaction') && prefs.likes === false) return;
        if ((type === 'comment' || type === 'story_reply') && prefs.comments === false) return;
        if (type === 'connection_request' && prefs.connectionRequests === false) return;
        if (type === 'new_post' && prefs.newPosts === false) return;

        await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            post: postId,
            story: storyId
        });
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

module.exports = { createNotification };
