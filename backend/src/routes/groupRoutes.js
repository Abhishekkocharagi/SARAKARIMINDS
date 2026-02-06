const express = require('express');
const router = express.Router();
const { protect, mentor } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/groupController');
const upload = require('../middleware/uploadMiddleware');

// Mentor Routes
router.post('/', protect, mentor, upload.single('paymentQrImage'), createGroup);

// Public/Student Routes
router.get('/mentor/:mentorId', protect, getMentorGroups);
router.post('/:groupId/join', protect, joinGroup);
router.get('/my', protect, getMyGroups);
router.get('/explore', protect, getAllGroups); // NEW: Categorized list
router.post('/:id/request-join', protect, requestJoinGroup); // NEW: Paid join
router.put('/memberships/:id/approve', protect, mentor, approveMembership); // NEW: Mentor approve

// Management Routes
router.get('/:id', protect, getGroupDetails);
router.get('/:id/members', protect, mentor, getGroupMembers);
router.delete('/:id', protect, mentor, deleteGroup);
router.delete('/:id/members/:userId', protect, mentor, removeMember);
router.put('/:id/status', protect, mentor, updateGroupStatus);
router.post('/:id/posts', protect, mentor, createGroupPost);
router.get('/:id/posts', protect, getGroupPosts);

module.exports = router;
