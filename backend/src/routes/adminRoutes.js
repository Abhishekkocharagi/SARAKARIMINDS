const express = require('express');
const router = express.Router();
const {
    getStats,
    getPendingMentors,
    getPendingAcademies,
    getAllUsers,
    blockUser,
    unblockUser,
    approveMentor,
    rejectMentor,
    approveAcademy,
    rejectAcademy,
    getAllContent,
    deleteContent,
    getPendingApplications,
    approveApplication,
    rejectApplication
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getStats);
router.get('/mentors/pending', protect, admin, getPendingMentors);
router.get('/academies/pending', protect, admin, getPendingAcademies);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/block/:userId', protect, admin, blockUser);
router.put('/users/unblock/:userId', protect, admin, unblockUser);
router.put('/mentors/approve/:userId', protect, admin, approveMentor);
router.put('/mentors/reject/:userId', protect, admin, rejectMentor);
router.put('/academies/approve/:userId', protect, admin, approveAcademy);
router.put('/academies/reject/:userId', protect, admin, rejectAcademy);
router.get('/content', protect, admin, getAllContent);
router.delete('/content/:postId', protect, admin, deleteContent);

// Legacy routes for backward compatibility
router.get('/applications', protect, admin, getPendingApplications);
router.put('/approve/:id', protect, admin, approveApplication);
router.put('/reject/:id', protect, admin, rejectApplication);

module.exports = router;
