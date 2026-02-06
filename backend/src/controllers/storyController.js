const asyncHandler = require('express-async-handler');
const Story = require('../models/Story');
const Message = require('../models/Message');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
const createStory = asyncHandler(async (req, res) => {
    const { content, mentions, tags, sharedPost } = req.body;
    let mediaUrl = '';
    let mediaType = 'image';

    if (req.file) {
        mediaUrl = req.file.path;
        mediaType = req.file.mimetype.includes('video') ? 'video' : 'image';
    }

    const story = new Story({
        user: req.user._id,
        content,
        mediaUrl,
        mediaType,
        sharedPost,
        mentions: mentions ? JSON.parse(mentions) : [],
        tags: tags ? JSON.parse(tags) : []
    });

    const createdStory = await story.save();

    // Notify mentioned users
    if (story.mentions && story.mentions.length > 0) {
        for (const mentionId of story.mentions) {
            if (mentionId.toString() !== req.user._id.toString()) {
                await createNotification(mentionId, req.user._id, 'mention', null, createdStory._id);
            }
        }
    }

    const populated = await Story.findById(createdStory._id)
        .populate('user', 'name profilePic')
        .populate('mentions', 'name');
    res.status(201).json(populated);
});

// @desc    Get active stories
// @route   GET /api/stories
// @access  Private
const getStories = asyncHandler(async (req, res) => {
    // Populate both connections and following to get their IDs
    const user = await req.user.populate('connections following');

    // Collect IDs: connections + following + self
    const connectionIds = user.connections.map(c => c._id);
    const followingIds = user.following.map(f => f._id);

    // Use Set to avoid duplicates if someone is both connected and followed (edge case)
    const allowedIds = [...new Set([...connectionIds, ...followingIds, req.user._id.toString()])];

    const stories = await Story.find({
        user: { $in: allowedIds },
        expiresAt: { $gt: new Date() }
    })
        .populate('user', 'name profilePic')
        .populate('user', 'name profilePic')
        .populate('mentions', 'name')
        .populate({ path: 'sharedPost', populate: { path: 'user', select: 'name profilePic' } })
        .sort({ createdAt: -1 }); // Newest first
    res.json(stories);
});

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);

    if (story) {
        // Add user to viewers if not already present
        if (!story.viewers.includes(req.user._id)) {
            story.viewers.push(req.user._id);
            await story.save();
        }
        res.json(story.viewers); // Return updated viewers list or just success
    } else {
        res.status(404);
        throw new Error('Story not found');
    }
});

// @desc    React to a story
// @route   PUT /api/stories/:id/react
// @access  Private
const reactStory = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const story = await Story.findById(req.params.id);

    if (story) {
        const existingReaction = story.reactions.find(r => r.user.toString() === req.user._id.toString());

        if (existingReaction) {
            existingReaction.type = type;
        } else {
            story.reactions.push({ user: req.user._id, type });
            // Notify if not self
            if (story.user.toString() !== req.user._id.toString()) {
                await createNotification(story.user, req.user._id, 'story_reaction', null, story._id);
            }
        }

        await story.save();
        res.json(story.reactions);
    } else {
        res.status(404);
        throw new Error('Story not found');
    }
});

// @desc    Reply to a story (sent as message)
// @route   POST /api/stories/:id/reply
// @access  Private
const replyStory = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const story = await Story.findById(req.params.id);

    if (story) {
        // Create a message
        const message = await Message.create({
            sender: req.user._id,
            recipient: story.user,
            text,
            story: story._id
        });

        // Create a notification
        if (story.user.toString() !== req.user._id.toString()) {
            await createNotification(story.user, req.user._id, 'story_reply', null, story._id);
        }

        // Notify mentioned users in reply
        const mentions = text.match(/@[\w\s.-]+/g);
        if (mentions) {
            const User = require('../models/User'); // Ensure User model is available
            for (const mention of mentions) {
                const name = mention.substring(1).trim();
                const mentionedUser = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
                    await createNotification(mentionedUser._id, req.user._id, 'mention', null, story._id);
                }
            }
        }

        res.status(201).json(message);
    } else {
        res.status(404);
        throw new Error('Story not found');
    }
});

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);

    if (story) {
        if (story.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to delete this story');
        }
        await story.deleteOne();
        res.json({ message: 'Story removed' });
    } else {
        res.status(404);
        throw new Error('Story not found');
    }
});

// @desc    Get story viewers
// @route   GET /api/stories/:id/viewers
// @access  Private
const getStoryViewers = asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id).populate('viewers', 'name profilePic');

    if (story) {
        if (story.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to see viewers of this story');
        }
        res.json(story.viewers);
    } else {
        res.status(404);
        throw new Error('Story not found');
    }
});

module.exports = {
    createStory,
    getStories,
    viewStory,
    reactStory,
    replyStory,
    deleteStory,
    getStoryViewers
};
