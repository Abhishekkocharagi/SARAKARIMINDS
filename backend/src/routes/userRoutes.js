const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
    getUsers,
    updateUserProfile,
    getUserById,
    toggleFollow,
    searchUsers,
    addRecentSearch,
    getRecentSearches,
    clearRecentSearches,
    deleteUser,
    applyMentor,
    applyAcademy,
    changePassword,
    changeEmail,
    deleteAccount,
    updateNotificationPreferences
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', registerUser); // Legacy direct registration
router.post('/login', authUser); // Legacy login route (alias)
router.get('/', protect, getUsers);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'coverPic', maxCount: 1 }]), updateUserProfile)
    .delete(protect, deleteUser);

// Search Routes
router.get('/search', protect, searchUsers);
router.route('/recent-search')
    .post(protect, addRecentSearch)
    .get(protect, getRecentSearches)
    .delete(protect, clearRecentSearches);

router.post('/apply-mentor', protect, upload.single('document'), applyMentor);
router.post('/apply-academy', protect, upload.single('document'), applyAcademy);

// Security Routes
router.put('/change-password', protect, changePassword);
router.put('/change-email', protect, changeEmail);
router.delete('/delete-account', protect, deleteAccount);
router.put('/notification-preferences', protect, updateNotificationPreferences);

router.get('/:id', protect, getUserById);
router.post('/:id/follow', protect, toggleFollow);

module.exports = router;

