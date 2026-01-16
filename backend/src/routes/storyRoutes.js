const express = require('express');
const router = express.Router();
const { createStory, getStories, viewStory, reactStory, replyStory } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getStories)
    .post(protect, upload.single('media'), createStory);

router.post('/:id/view', protect, viewStory);
router.put('/:id/react', protect, reactStory);
router.post('/:id/reply', protect, replyStory);

module.exports = router;
