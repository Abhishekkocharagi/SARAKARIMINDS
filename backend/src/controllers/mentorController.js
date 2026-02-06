const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/stats
// @access  Private/Mentor
const getMentorStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Calculate post reach (simple view count simulation or sum of reactions + comments)
    const posts = await Post.find({ user: req.user._id });
    const postReach = posts.reduce((acc, post) => acc + post.reactions.length + post.comments.length, 0);

    const followersCount = user.followers.length;
    const connectionsCount = user.connections.length;
    const earnings = user.mentorEarnings;
    const pendingBookings = user.availabilitySlots.filter(slot => slot.isBooked).length;

    res.json({
        followersCount,
        connectionsCount,
        postReach,
        earnings,
        pendingBookings
    });
});

// @desc    Update mentorship settings
// @route   PUT /api/mentor/settings
// @access  Private/Mentor
const updateSettings = asyncHandler(async (req, res) => {
    const { enabled, price, slots } = req.body;
    const user = await User.findById(req.user._id);

    if (enabled !== undefined) user.mentorshipEnabled = enabled;
    if (price !== undefined) user.mentorshipPrice = price;
    if (slots !== undefined) {
        // Merge or replace logic - here replacing for simplicity
        user.availabilitySlots = slots;
    }

    await user.save();
    res.json({
        message: 'Mentorship settings updated', settings: {
            enabled: user.mentorshipEnabled,
            price: user.mentorshipPrice,
            slots: user.availabilitySlots
        }
    });
});

// @desc    Book a mentorship session
// @route   POST /api/mentor/:id/book
// @access  Private (Student)
const bookSession = asyncHandler(async (req, res) => {
    const mentorId = req.params.id;
    const { slotId } = req.body; // Assuming slot has specific _id or index

    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.isVerified || mentor.role !== 'mentor') {
        res.status(404);
        throw new Error('Mentor not found or not verified');
    }

    const slot = mentor.availabilitySlots.id(slotId);
    if (!slot) {
        res.status(404);
        throw new Error('Slot not found');
    }

    if (slot.isBooked) {
        res.status(400);
        throw new Error('Slot already booked');
    }

    slot.isBooked = true;
    slot.bookedBy = req.user._id;

    await mentor.save();

    // Notify Mentor
    await Notification.create({
        recipient: mentor._id,
        sender: req.user._id,
        type: 'system',
        message: `New mentorship booking from ${req.user.name} for ${slot.day} at ${slot.startTime}`
    });

    res.json({ message: 'Session booked successfully' });
});

module.exports = {
    getMentorStats,
    updateSettings,
    bookSession
};
