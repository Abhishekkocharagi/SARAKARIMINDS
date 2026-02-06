const express = require('express');
const router = express.Router();
const { protect, academy, admin } = require('../middleware/authMiddleware');
const {
    createCampaign,
    getMyCampaigns,
    getAllCampaigns,
    updateCampaignStatus,
    trackCampaign
} = require('../controllers/campaignController');

// Academy Routes
router.post('/', protect, academy, createCampaign);
router.get('/my', protect, academy, getMyCampaigns);

// Admin Routes
router.get('/admin', protect, admin, getAllCampaigns);
router.put('/:id/status', protect, admin, updateCampaignStatus);

// Tracking (Public/Protected)
router.post('/:id/track', protect, trackCampaign);

module.exports = router;
