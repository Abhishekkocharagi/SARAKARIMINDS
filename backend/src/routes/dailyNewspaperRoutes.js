const express = require('express');
const router = express.Router();
const {
    getNewspapers,
    getAllNewspapers,
    getNewspaperById,
    createNewspaper,
    updateNewspaper,
    deleteNewspaper,
    recordView,
    toggleVisibility
} = require('../controllers/dailyNewspaperController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/User routes
router.get('/', protect, getNewspapers);
router.get('/:id', protect, getNewspaperById);
router.post('/:id/view', protect, recordView);

// Admin routes
router.get('/admin/all', protect, admin, getAllNewspapers);
router.post('/admin', protect, admin, createNewspaper);
router.put('/admin/:id', protect, admin, updateNewspaper);
router.delete('/admin/:id', protect, admin, deleteNewspaper);
router.patch('/admin/:id/toggle-visibility', protect, admin, toggleVisibility);

module.exports = router;
