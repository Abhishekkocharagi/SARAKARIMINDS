const express = require('express');
const router = express.Router();
const {
    addJilebiPuzzle,
    getAllJilebiPuzzles,
    deleteJilebiPuzzle,
    updateJilebiPuzzle,
    getTodayJilebiPuzzles,
    submitJilebiAttempt
} = require('../controllers/jilebiController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
// These will be mounted at /api/jilebi
router.get('/today', protect, getTodayJilebiPuzzles);
router.post('/submit', protect, submitJilebiAttempt);

// Admin routes
// These will be mounted at /api/admin/jilebi
// So POST / creates, GET / gets all
router.get('/', protect, admin, getAllJilebiPuzzles);
router.post('/', protect, admin, addJilebiPuzzle);
router.put('/:id', protect, admin, updateJilebiPuzzle);
router.delete('/:id', protect, admin, deleteJilebiPuzzle);

module.exports = router;
