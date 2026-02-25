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
    rejectMembership,
    getPendingMembers,
    updateChatSettings,
    addMemberManually,
    updateMemberRole,
    deleteGroup
} = require('../controllers/groupController');
const upload = require('../middleware/uploadMiddleware');

// Creation Route (Open to all verified users)
router.post('/', protect, upload.fields([{ name: 'groupIcon', maxCount: 1 }, { name: 'paymentQrImage', maxCount: 1 }]), createGroup);

// Public/Student Routes
router.get('/mentor/:mentorId', protect, getMentorGroups);
router.post('/:groupId/join', protect, joinGroup);
router.get('/my', protect, getMyGroups);
router.get('/explore', protect, getAllGroups); // NEW: Categorized list
router.post('/:id/request-join', protect, requestJoinGroup); // NEW: Paid join
router.put('/memberships/:id/approve', protect, approveMembership); // NEW: Mentor approve
router.delete('/memberships/:id/reject', protect, rejectMembership);
router.get('/:id/pending-members', protect, getPendingMembers);

// Management Routes
router.get('/:id', protect, getGroupDetails);
router.get('/:id/members', protect, getGroupMembers);
router.delete('/:id', protect, deleteGroup);
router.delete('/:id/members/:userId', protect, removeMember);
router.put('/:id/status', protect, updateGroupStatus);
router.put('/:id/chat-settings', protect, updateChatSettings);
router.post('/:id/add-member', protect, addMemberManually);
router.put('/:id/members/:userId/role', protect, updateMemberRole);
router.post('/:id/posts', protect, createGroupPost);
router.get('/:id/posts', protect, getGroupPosts);

module.exports = router;
