const express = require('express');
const router = express.Router();
const { protect, mentor } = require('../middleware/authMiddleware');
const { getMentorStats, updateSettings, bookSession } = require('../controllers/mentorController');

router.get('/stats', protect, mentor, getMentorStats);
router.put('/settings', protect, mentor, updateSettings);
router.post('/:id/book', protect, bookSession); // Accessible by students (protect only)

module.exports = router;
