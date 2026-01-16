const express = require('express');
const router = express.Router();
const { getPosts, createPost, likePost, commentPost, getUserPosts } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getPosts)
    .post(protect, upload.single('media'), createPost);

router.get('/user/:userId', protect, getUserPosts);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);

module.exports = router;
