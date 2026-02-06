const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['like', 'comment', 'connection_request', 'connection_accepted', 'new_post', 'story_reaction', 'story_reply', 'system', 'job_update', 'mention'],
        required: true
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    jobUpdate: { type: mongoose.Schema.Types.ObjectId, ref: 'JobUpdate' },
    isRead: { type: Boolean, default: false },
    message: String, // For system notifications
    title: String,
    link: String
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
