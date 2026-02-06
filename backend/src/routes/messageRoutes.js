const express = require('express');
const router = express.Router();
const {
    getConversations,
    getMessages,
    sendMessage,
    getBots,
    updatePreference,
    deleteConversation,
    deleteSingleMessage,
    markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/bots', protect, getBots);
router.get('/:id', protect, getMessages);
router.post('/', protect, upload.single('file'), sendMessage);
router.put('/preference/:id', protect, updatePreference);
router.delete('/conversation/:id', protect, deleteConversation);
router.delete('/:id/single', protect, deleteSingleMessage);
router.put('/read-all', protect, markMessagesAsRead);

module.exports = router;
