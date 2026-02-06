const express = require('express');
const router = express.Router();
const { getPosts, createPost, likePost, commentPost, getUserPosts, updateLastFeedVisit, deletePost, toggleSavePost, getSavedPosts, getPostById, deleteComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getPosts)
    .post(protect, upload.single('media'), createPost);


router.get('/saved/all', protect, getSavedPosts);
router.get('/user/:userId', protect, getUserPosts);
router.get('/:id', protect, getPostById);
router.post('/:id/save', protect, toggleSavePost);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);
router.delete('/:id/comment/:commentId', protect, deleteComment);
router.put('/last-visit', protect, updateLastFeedVisit);
router.delete('/:id', protect, deletePost);

module.exports = router;
