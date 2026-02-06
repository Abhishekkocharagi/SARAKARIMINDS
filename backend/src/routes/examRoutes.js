const express = require('express');
const router = express.Router();
const {
    getExams,
    getExamDetails,
    selectExams,
    getPreferences
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getExams);
router.get('/preferences', protect, getPreferences);
router.get('/:name', getExamDetails);
router.post('/select', protect, selectExams);

module.exports = router;
