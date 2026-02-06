const express = require('express');
const router = express.Router();
const {
    addDailyQuestion,
    getDailyStatus,
    getDailyQuiz,
    deleteQuestion,
    getTodayAdminQuestions,
    recordQuizCompletion
} = require('../controllers/quizController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.get('/:subject', protect, getDailyQuiz);
router.post('/complete', protect, recordQuizCompletion);

// Admin routes
router.post('/admin/add', protect, admin, addDailyQuestion);
router.get('/admin/status', protect, admin, getDailyStatus);
router.get('/admin/today/:subject', protect, admin, getTodayAdminQuestions);
router.delete('/admin/:id', protect, admin, deleteQuestion);

module.exports = router;
