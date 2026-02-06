const express = require('express');
const router = express.Router();
const {
    getDailyCandidates,
    selectDailyWord,
    getTodayPuzzle,
    submitAttempt,
    getStats,
    resetDaily
} = require('../controllers/wordPathController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.get('/today', protect, getTodayPuzzle);
router.post('/submit', protect, submitAttempt);

// Admin routes
router.get('/candidates', protect, admin, getDailyCandidates);
router.post('/select', protect, admin, selectDailyWord);
router.get('/stats', protect, admin, getStats);

router.delete('/daily', protect, admin, resetDaily);

module.exports = router;
