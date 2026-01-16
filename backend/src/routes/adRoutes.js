const express = require('express');
const router = express.Router();
const {
    getAdBySlot,
    getAllAds,
    createAd,
    updateAd,
    deleteAd
} = require('../controllers/adController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to fetch ads
router.get('/slot/:slot', getAdBySlot);

// Admin routes (prefixed by /api/admin/ads in index.js)
router.get('/', protect, admin, getAllAds);
router.post('/create', protect, admin, createAd);
router.put('/:id', protect, admin, updateAd);
router.delete('/:id', protect, admin, deleteAd);

module.exports = router;
