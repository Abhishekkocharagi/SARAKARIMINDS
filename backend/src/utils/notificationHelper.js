const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (recipientId, senderId, type, postId = null, storyId = null) => {
    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) return;

        // Check user preferences (assuming reactions/replies follow likes/comments prefs for now)
        const prefs = recipient.notificationPreferences;
        if ((type === 'like' || type === 'story_reaction') && !prefs.likes) return;
        if ((type === 'comment' || type === 'story_reply') && !prefs.comments) return;
        if (type === 'connection_request' && !prefs.connectionRequests) return;
        if (type === 'new_post' && !prefs.newPosts) return;

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
