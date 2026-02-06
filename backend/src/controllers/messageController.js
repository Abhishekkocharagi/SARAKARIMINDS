const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const ConversationPreference = require('../models/ConversationPreference');

// Helper to ensure bots exist
const ensureBots = async () => {
    const bots = [
        { name: 'Sarkari Assistant', email: 'assistant_bot@sm.com', botType: 'assistant', profilePic: '' },
        { name: 'Exam Predictor', email: 'exam_bot@sm.com', botType: 'exam', profilePic: '' },
        { name: 'Career Guide', email: 'career_bot@sm.com', botType: 'career', profilePic: '' }
    ];

    for (const b of bots) {
        let bot = await User.findOne({ email: b.email });
        if (!bot) {
            await User.create({
                ...b,
                password: 'bot_secure_password_123',
                isBot: true,
                accountType: 'Mentor',
                about: `Virtual ${b.name} for SarkariMinds.`
            });
        }
    }
};

// @desc    Get system bots
const getBots = asyncHandler(async (req, res) => {
    await ensureBots();
    const bots = await User.find({ isBot: true }).select('name profilePic accountType about botType isBot');
    res.json(bots);
});

// @desc    Get user's conversations
const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const prefs = await ConversationPreference.find({ user: userId });
    const prefMap = {};
    prefs.forEach(p => { prefMap[p.targetUser.toString()] = p; });

    // Filter out messages that the current user has "deleted for me"
    const messages = await Message.find({
        $or: [{ sender: userId }, { recipient: userId }],
        deletedBy: { $ne: userId }
    })
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePic accountType isBot')
        .populate('recipient', 'name profilePic accountType isBot');

    const conversations = [];
    const processedUsers = new Set();

    for (const msg of messages) {
        const otherUser = msg.sender?._id.toString() === userId.toString() ? msg.recipient : msg.sender;
        if (!otherUser) continue;
        const otherUserId = otherUser._id.toString();

        if (!processedUsers.has(otherUserId)) {
            processedUsers.add(otherUserId);

            const pref = prefMap[otherUserId] || {
                isStarred: false,
                isMuted: false,
                isArchived: false,
                isFocused: true,
                label: 'General'
            };

            const unreadCount = await Message.countDocuments({
                sender: otherUserId,
                recipient: userId,
                isRead: false,
                deletedBy: { $ne: userId }
            });

            let lastText = msg.isDeletedForEveryone ? 'This message was deleted' : (msg.text || (msg.fileUrl ? 'Sent a file' : 'Attachment'));

            conversations.push({
                user: otherUser,
                lastMessage: {
                    text: lastText,
                    createdAt: msg.createdAt,
                    sender: msg.sender._id
                },
                unreadCount,
                preferences: pref
            });
        }
    }

    res.json(conversations);
});

// @desc    Get messages for a specific user
const getMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const otherUserId = req.params.id;

    const messages = await Message.find({
        $or: [
            { sender: userId, recipient: otherUserId },
            { sender: otherUserId, recipient: userId }
        ],
        deletedBy: { $ne: userId }
    })
        .sort({ createdAt: 1 })
        .populate('sender', 'name profilePic accountType isBot')
        .populate('recipient', 'name profilePic accountType isBot')
        .populate({
            path: 'post',
            select: 'content mediaUrl mediaType user',
            populate: { path: 'user', select: 'name profilePic' }
        });

    // For display, if isDeletedForEveryone is true, we strip sensitive info
    const sanitizedMessages = messages.map(m => {
        if (m.isDeletedForEveryone) {
            return {
                ...m._doc,
                text: 'This message was deleted',
                fileUrl: null,
                fileName: null,
                fileType: null
            };
        }
        return m;
    });

    await Message.updateMany(
        { sender: otherUserId, recipient: userId, isRead: false },
        { isRead: true }
    );

    res.json(sanitizedMessages);
});

// @desc    Send message
const sendMessage = asyncHandler(async (req, res) => {
    const { recipientId, text, storyId, postId } = req.body;
    let fileData = {};

    if (req.file) {
        fileData = {
            fileUrl: req.file.path,
            fileType: req.file.mimetype,
            fileName: req.file.originalname
        };
    }

    if (!text && !req.file && !postId) {
        res.status(400);
        throw new Error('Message must contain text, a file, or a post attachment');
    }

    const message = await Message.create({
        sender: req.user._id,
        recipient: recipientId,
        text: text || '',
        story: storyId || null,
        post: postId || null,
        ...fileData
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name profilePic accountType')
        .populate('recipient', 'name profilePic accountType')
        .populate({
            path: 'post',
            select: 'content mediaUrl mediaType user',
            populate: { path: 'user', select: 'name profilePic' }
        });

    // Bot logic
    const recipient = await User.findById(recipientId);
    if (recipient && recipient.isBot) {
        setTimeout(async () => {
            let botResponse = "I have received your message.";
            if (recipient.botType === 'assistant') botResponse = "How can I assist you today?";
            await Message.create({
                sender: recipientId,
                recipient: req.user._id,
                text: `[Bot] ${botResponse}`
            });
        }, 1500);
    }

    res.status(201).json(populatedMessage);
});

// @desc    Delete single message
// @route   DELETE /api/messages/:id/single
const deleteSingleMessage = asyncHandler(async (req, res) => {
    const { mode } = req.query; // 'me' or 'everyone'
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (mode === 'everyone') {
        // Only sender can delete for everyone
        if (message.sender.toString() !== userId.toString()) {
            res.status(401);
            throw new Error('Only the sender can delete for everyone');
        }
        message.isDeletedForEveryone = true;
        message.text = 'This message was deleted';
        message.fileUrl = undefined;
        message.fileName = undefined;
    } else {
        // Delete for me
        if (!message.deletedBy.includes(userId)) {
            message.deletedBy.push(userId);
        }
    }

    await message.save();
    res.json({ message: 'Message deleted successfully' });
});

// @desc    Update conversation preference
const updatePreference = asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const userId = req.user._id;
    const updates = req.body;

    let pref = await ConversationPreference.findOne({ user: userId, targetUser: targetUserId });
    if (!pref) {
        pref = await ConversationPreference.create({ user: userId, targetUser: targetUserId, ...updates });
    } else {
        Object.assign(pref, updates);
        await pref.save();
    }
    res.json(pref);
});

// @desc    Delete conversation (Delete for me)
const deleteConversation = asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const userId = req.user._id;

    // We don't actually delete from DB, we just mark as deleted for this user
    const messages = await Message.find({
        $or: [
            { sender: userId, recipient: targetUserId },
            { sender: targetUserId, recipient: userId }
        ]
    });

    for (const msg of messages) {
        if (!msg.deletedBy.includes(userId)) {
            msg.deletedBy.push(userId);
            await msg.save();
        }
    }

    res.json({ message: 'Conversation deleted for you' });
});

// @desc    Mark all unread messages as read
// @route   PUT /api/messages/read-all
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
    await Message.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );
    res.json({ message: 'All messages marked as read' });
});

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    getBots,
    updatePreference,
    deleteConversation,
    deleteSingleMessage,
    markMessagesAsRead
};
