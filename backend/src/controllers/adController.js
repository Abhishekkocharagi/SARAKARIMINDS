const asyncHandler = require('express-async-handler');
const Ad = require('../models/Ad');

// @desc    Get ad by slot
// @route   GET /api/ads/:slot
// @access  Public
const getAdBySlot = asyncHandler(async (req, res) => {
    const { slot } = req.params;
    const now = new Date();

    const ads = await Ad.find({
        slot,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
    }).sort({ priority: -1 });

    if (ads.length === 0) {
        return res.json(null);
    }

    // Sort by priority (highest first) is already done by .sort({ priority: -1 })
    // If priorities are equal, we should rotate or pick randomly among those with same top priority.
    const topPriority = ads[0].priority;
    const topPriorityAds = ads.filter(ad => ad.priority === topPriority);

    // Pick a random one from topPriorityAds
    const randomAd = topPriorityAds[Math.floor(Math.random() * topPriorityAds.length)];

    res.json(randomAd);
});

// @desc    Get all ads (for admin)
// @route   GET /api/admin/ads
// @access  Private/Admin
const getAllAds = asyncHandler(async (req, res) => {
    const ads = await Ad.find({}).sort({ createdAt: -1 });
    res.json(ads);
});

// @desc    Create an ad
// @route   POST /api/admin/ads/create
// @access  Private/Admin
const createAd = asyncHandler(async (req, res) => {
    const { title, description, imageUrl, redirectUrl, slot, startDate, endDate, priority } = req.body;

    const ad = await Ad.create({
        title,
        description,
        imageUrl,
        redirectUrl,
        slot,
        startDate,
        endDate,
        priority,
        createdBy: req.user._id
    });

    if (ad) {
        res.status(201).json(ad);
    } else {
        res.status(400);
        throw new Error('Invalid ad data');
    }
});

// @desc    Update an ad
// @route   PUT /api/admin/ads/:id
// @access  Private/Admin
const updateAd = asyncHandler(async (req, res) => {
    const ad = await Ad.findById(req.params.id);

    if (ad) {
        ad.title = req.body.title || ad.title;
        ad.description = req.body.description || ad.description;
        ad.imageUrl = req.body.imageUrl || ad.imageUrl;
        ad.redirectUrl = req.body.redirectUrl || ad.redirectUrl;
        ad.slot = req.body.slot || ad.slot;
        ad.status = req.body.status || ad.status;
        ad.startDate = req.body.startDate || ad.startDate;
        ad.endDate = req.body.endDate || ad.endDate;
        ad.priority = req.body.priority ?? ad.priority;

        const updatedAd = await ad.save();
        res.json(updatedAd);
    } else {
        res.status(404);
        throw new Error('Ad not found');
    }
});

// @desc    Delete an ad
// @route   DELETE /api/admin/ads/:id
// @access  Private/Admin
const deleteAd = asyncHandler(async (req, res) => {
    const ad = await Ad.findById(req.params.id);

    if (ad) {
        await ad.deleteOne();
        res.json({ message: 'Ad removed' });
    } else {
        res.status(404);
        throw new Error('Ad not found');
    }
});

module.exports = {
    getAdBySlot,
    getAllAds,
    createAd,
    updateAd,
    deleteAd
};
