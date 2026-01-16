const express = require('express');
const router = express.Router();
const {
    getMyExamNews,
    recordNewsView,
    getAllExamNews,
    createExamNews,
    updateExamNews,
    deleteExamNews
} = require('../controllers/examNewsController');
const { protect, admin } = require('../middleware/authMiddleware');

// User route
router.get('/', protect, getMyExamNews);
router.post('/:id/view', protect, recordNewsView);

// Admin routes (prefixed in index.js)
router.get('/all', protect, admin, getAllExamNews);
router.post('/', protect, admin, createExamNews);
router.put('/:id', protect, admin, updateExamNews);
router.delete('/:id', protect, admin, deleteExamNews);

module.exports = router;
