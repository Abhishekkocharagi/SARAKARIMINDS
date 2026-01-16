const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markSingleAsRead, getUnreadCounts } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getNotifications);

router.put('/read', protect, markAsRead);
router.get('/unread-counts', protect, getUnreadCounts);
router.put('/:id/read', protect, markSingleAsRead);

module.exports = router;
