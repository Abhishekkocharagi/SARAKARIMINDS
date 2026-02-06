const asyncHandler = require('express-async-handler');
const MentorGroup = require('../models/MentorGroup');
const GroupMembership = require('../models/GroupMembership');
const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Create a new paid group
// @route   POST /api/groups
// @access  Private/Mentor
const createGroup = asyncHandler(async (req, res) => {
    const { name, description, examCategory, price, paymentType, maxMembers, groupIcon } = req.body;

    // DEBUG: Temporary logs for authorization debugging
    console.log('Group Creation Request:', {
        userId: req.user._id,
        role: req.user.role,
        isVerified: req.user.isVerified,
        body: req.body
    });

    // STRICT CHECK: Role must be mentor, academy or admin AND verified
    if (!['mentor', 'academy', 'admin'].includes(req.user.role) || !req.user.isVerified) {
        res.status(403); // Using 403 Forbidden is more appropriate than 401 Unauthorized for role mismatches
        throw new Error(`Access denied: Only verified mentors or academies can create groups. Current role: ${req.user.role}, Verified: ${!!req.user.isVerified}`);
    }

    const group = await MentorGroup.create({
        mentor: req.user._id,
        name,
        description,
        examCategory,
        price,
        paymentType,
        maxMembers,
        groupIcon,
        paymentQrImage: req.file ? req.file.path : req.body.paymentQrImage // Save uploaded file or fallback to string
    });

    res.status(201).json(group);
});

// @desc    Get all groups for a mentor (public/student view)
// @route   GET /api/groups/mentor/:mentorId
// @access  Private
const getMentorGroups = asyncHandler(async (req, res) => {
    const groups = await MentorGroup.find({ mentor: req.params.mentorId, status: 'active' });

    // Check membership status for the current user for each group
    const groupsWithStatus = await Promise.all(groups.map(async (group) => {
        const membership = await GroupMembership.findOne({
            user: req.user._id,
            group: group._id,
            paymentStatus: 'active'
        });

        return {
            ...group.toObject(),
            isMember: !!membership
        };
    }));

    res.json(groupsWithStatus);
});

// @desc    Join a group (Simulate Payment)
// @route   POST /api/groups/:groupId/join
// @access  Private
const joinGroup = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.groupId);

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.status !== 'active') {
        res.status(400);
        throw new Error('Group is not active');
    }

    // Check if already a member
    const existingMembership = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id,
        paymentStatus: 'active'
    });

    if (existingMembership) {
        res.status(400);
        throw new Error('You are already a member of this group');
    }

    // SIMULATE PAYMENT SUCCESS
    const expiryDate = new Date();
    if (group.paymentType === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100); // Lifetime
    }

    const membership = await GroupMembership.create({
        user: req.user._id,
        group: group._id,
        paymentStatus: 'active',
        amountPaid: group.price,
        expiryDate
    });

    // Update member count
    group.memberCount = await GroupMembership.countDocuments({ group: group._id, paymentStatus: 'active' });
    await group.save();

    // Update Mentor Earnings
    const mentor = await User.findById(group.mentor);
    if (mentor) {
        mentor.mentorEarnings = (mentor.mentorEarnings || 0) + group.price;
        await mentor.save();
    }

    res.status(201).json({ message: 'Joined group successfully', membership });
});



// @desc    Get my joined groups
// @route   GET /api/groups/my
// @access  Private
const getMyGroups = asyncHandler(async (req, res) => {
    const memberships = await GroupMembership.find({
        user: req.user._id,
        paymentStatus: 'active'
    }).populate('group');

    // Filter out null groups (if deleted)
    const validGroups = memberships
        .filter(m => m.group)
        .map(m => m.group);

    res.json(validGroups);
});

// @desc    Get ALL groups categorized (My, Paid, Free)
// @route   GET /api/groups/explore
// @access  Private
const getAllGroups = asyncHandler(async (req, res) => {
    // 1. My Communities (Active memberships)
    const myMemberships = await GroupMembership.find({
        user: req.user._id,
        paymentStatus: 'active'
    }).populate('group');
    const myGroups = myMemberships.map(m => m.group).filter(g => g && g.status === 'active');

    // 2. Paid Communities (excluding joined)
    const paidGroups = await MentorGroup.find({
        isPaid: true,
        status: 'active',
        _id: { $nin: myGroups.map(g => g._id) } // Exclude already joined
    }).populate('mentor', 'name profilePic');

    // 3. Free Communities (excluding joined)
    const freeGroups = await MentorGroup.find({
        isPaid: false,
        status: 'active',
        _id: { $nin: myGroups.map(g => g._id) }
    }).populate('mentor', 'name profilePic');

    res.json({
        myCommunities: myGroups,
        paidCommunities: paidGroups,
        freeCommunities: freeGroups
    });
});

// @desc    Request to join a paid group (User clicks "I have paid")
// @route   POST /api/groups/:id/request-join
// @access  Private
const requestJoinGroup = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    // Check if already a member or pending
    const existing = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id
    });

    if (existing && existing.paymentStatus === 'active') {
        res.status(400);
        throw new Error('Already a member');
    }

    if (existing && existing.paymentStatus === 'pending') {
        res.status(400);
        throw new Error('Join request already pending approval');
    }

    // Create Pending Membership
    const membership = await GroupMembership.create({
        user: req.user._id,
        group: group._id,
        paymentStatus: 'pending', // Waiting for mentor approval
        amountPaid: group.price
    });

    // Notify Mentor
    // Make sure Notification model is imported at top if not already (I will add it)
    /* 
    await Notification.create({
        recipient: group.mentor,
        sender: req.user._id,
        type: 'payment_request',
        message: `${req.user.name} has requested to join ${group.name}. Please verify payment.`
    });
    */

    res.status(201).json({ message: 'Request sent. Waiting for mentor approval.', membership });
});


// @desc    Approve a membership request (Mentor action)
// @route   PUT /api/groups/memberships/:id/approve
// @access  Private/Mentor
const approveMembership = asyncHandler(async (req, res) => {
    const membership = await GroupMembership.findById(req.params.id).populate('group');
    if (!membership) {
        res.status(404);
        throw new Error('Request not found');
    }

    const group = membership.group;
    if (group.mentor.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    membership.paymentStatus = 'active';
    membership.expiryDate = new Date();
    membership.expiryDate.setMonth(membership.expiryDate.getMonth() + 1); // Default 1 month
    await membership.save();

    // Update member count
    group.memberCount = await GroupMembership.countDocuments({ group: group._id, paymentStatus: 'active' });
    await group.save();

    // Update Earnings
    const mentor = await User.findById(req.user._id);
    mentor.mentorEarnings = (mentor.mentorEarnings || 0) + membership.amountPaid;
    await mentor.save();

    // Notify User (Logic to be added)

    res.json({ message: 'Membership approved', membership });
});

// @desc    Get single group details (for Mentor Management)
// @route   GET /api/groups/:id
// @access  Private
const getGroupDetails = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    // Verify ownership or membership logic here if stricter security needed
    // For now allowing if valid ID, but frontend should handle owner checks for management UI

    // Add membership check for current user
    const membership = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id,
        paymentStatus: 'active'
    });

    res.json({
        ...group.toObject(),
        isWrapper: true, // Just to tag response
        isMember: !!membership,
        isOwner: group.mentor.toString() === req.user._id.toString()
    });
});

// @desc    Get group members
// @route   GET /api/groups/:id/members
// @access  Private/Mentor
const getGroupMembers = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.mentor.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const memberships = await GroupMembership.find({ group: req.params.id, paymentStatus: 'active' })
        .populate('user', 'name email profilePic');

    res.json(memberships);
});

// @desc    Remove a member
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private/Mentor
const removeMember = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.mentor.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await GroupMembership.findOneAndDelete({
        group: req.params.id,
        user: req.params.userId
    });

    // Update count
    group.memberCount = await GroupMembership.countDocuments({ group: group._id, paymentStatus: 'active' });
    await group.save();

    res.json({ message: 'Member removed' });
});

// @desc    Update group status
// @route   PUT /api/groups/:id/status
// @access  Private/Mentor
const updateGroupStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'active' or 'disabled'
    const group = await MentorGroup.findById(req.params.id);

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.mentor.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    group.status = status;
    await group.save();
    res.json(group);
});

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private/Mentor
const deleteGroup = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.mentor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this group');
    }

    // Delete associated memberships
    await GroupMembership.deleteMany({ group: group._id });

    // Delete associated posts
    await Post.deleteMany({ group: group._id });

    await group.deleteOne();

    res.json({ message: 'Group deleted successfully' });
});

// @desc    Create a group post (Announcement/File)
// @route   POST /api/groups/:id/posts
// @access  Private/Mentor
const createGroupPost = asyncHandler(async (req, res) => {
    const { content, mediaUrl, mediaType } = req.body;
    const group = await MentorGroup.findById(req.params.id);

    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.mentor.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const post = await Post.create({
        user: req.user._id,
        group: group._id,
        content,
        mediaUrl,
        mediaType,
        postType: 'regular' // Or specific types if needed
    });

    res.status(201).json(post);
});

// @desc    Get group posts
// @route   GET /api/groups/:id/posts
// @access  Private (Member or Mentor)
const getGroupPosts = asyncHandler(async (req, res) => {
    const group = await MentorGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check access
    const isOwner = group.mentor.toString() === req.user._id.toString();
    const isMember = await GroupMembership.findOne({ user: req.user._id, group: group._id, paymentStatus: 'active' });

    if (!isOwner && !isMember) {
        res.status(401);
        throw new Error('Not authorized to view this group content');
    }

    const posts = await Post.find({ group: group._id })
        .populate('user', 'name profilePic')
        .sort({ createdAt: -1 });

    res.json(posts);
});


module.exports = {
    createGroup,
    getMentorGroups,
    joinGroup,
    getMyGroups,
    getGroupDetails,
    getGroupMembers,
    removeMember,
    updateGroupStatus,
    createGroupPost,
    getGroupPosts,
    getAllGroups,
    requestJoinGroup,
    approveMembership,
    deleteGroup
};
