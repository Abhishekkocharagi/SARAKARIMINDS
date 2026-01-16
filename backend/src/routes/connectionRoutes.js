const express = require('express');
const router = express.Router();
const {
    sendConnectionRequest,
    respondToRequest,
    getPendingRequests,
    getConnections,
    getSuggestions,
    removeConnection,
    getSentRequests,
    withdrawRequest
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getConnections);
router.get('/suggestions', protect, getSuggestions);
router.get('/sent', protect, getSentRequests);
router.get('/pending', protect, getPendingRequests);

router.post('/request', protect, sendConnectionRequest);
router.put('/respond', protect, respondToRequest);
router.delete('/withdraw/:id', protect, withdrawRequest);
router.delete('/:id', protect, removeConnection);

module.exports = router;
