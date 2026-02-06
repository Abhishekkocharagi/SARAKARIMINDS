const express = require('express');
const router = express.Router();
const { protect, academy } = require('../middleware/authMiddleware');
const { getAcademyStats, createAcademyPost } = require('../controllers/academyController');

router.get('/stats', protect, academy, getAcademyStats);
router.post('/post', protect, academy, createAcademyPost);

module.exports = router;
