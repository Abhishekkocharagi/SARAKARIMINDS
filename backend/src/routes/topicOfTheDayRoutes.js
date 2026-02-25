const express = require('express');
const router = express.Router();
const { getTopicsOfTheDay } = require('../controllers/topicOfTheDayController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTopicsOfTheDay);

module.exports = router;
