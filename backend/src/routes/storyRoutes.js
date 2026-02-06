const express = require('express');
const router = express.Router();
const { createStory, getStories, viewStory, reactStory, replyStory, deleteStory, getStoryViewers } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getStories)
    .post(protect, upload.single('media'), createStory);

router.post('/:id/view', protect, viewStory);
router.get('/:id/viewers', protect, getStoryViewers);
router.put('/:id/react', protect, reactStory);
router.post('/:id/reply', protect, replyStory);
router.delete('/:id', protect, deleteStory);

module.exports = router;
