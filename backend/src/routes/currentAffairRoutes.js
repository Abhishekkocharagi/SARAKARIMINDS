const express = require('express');
const router = express.Router();
const {
    addEntry,
    getAllEntries,
    updateEntry,
    deleteEntry,
    toggleSave,
    markRead
} = require('../controllers/currentAffairController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/User routes
router.get('/', protect, getAllEntries); // Allow public read but prefer logged in for personalization
router.put('/:id/save', protect, toggleSave);
router.put('/:id/read', protect, markRead);

// Admin routes
// Admin routes
router.post('/admin', protect, admin, addEntry); // POST /api/current-affairs/admin -> maps to "add entry"
router.get('/admin', protect, admin, getAllEntries); // GET /api/current-affairs/admin -> list entries (admin view)
router.put('/admin/:id', protect, admin, updateEntry);
router.delete('/admin/:id', protect, admin, deleteEntry);

module.exports = router;
