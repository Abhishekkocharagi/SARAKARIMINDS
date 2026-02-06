const asyncHandler = require('express-async-handler');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private/Academy
const createCampaign = asyncHandler(async (req, res) => {
    const { name, type, targetExams, targetLocation, budget, durationDays, adContent } = req.body;

    if (req.user.role !== 'academy') {
        res.status(401);
        throw new Error('Only academies can create campaigns');
    }

    const campaign = await Campaign.create({
        academy: req.user._id,
        name,
        type,
        targetExams,
        targetLocation,
        budget,
        durationDays,
        adContent,
        status: 'pending' // Default status
    });

    res.status(201).json(campaign);
});

// @desc    Get my campaigns
// @route   GET /api/campaigns/my
// @access  Private/Academy
const getMyCampaigns = asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find({ academy: req.user._id }).sort({ createdAt: -1 });
    res.json(campaigns);
});

// @desc    Get all campaigns (Admin)
// @route   GET /api/campaigns/admin
// @access  Private/Admin
const getAllCampaigns = asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find({}).populate('academy', 'name email').sort({ createdAt: -1 });
    res.json(campaigns);
});

// @desc    Update campaign status (Admin)
// @route   PUT /api/campaigns/:id/status
// @access  Private/Admin
const updateCampaignStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
        res.status(404);
        throw new Error('Campaign not found');
    }

    campaign.status = status;
    if (status === 'rejected' && reason) {
        campaign.rejectionReason = reason;
    }

    // If approved, set start dates (simplified logic)
    if (status === 'approved' && !campaign.startDate) {
        campaign.startDate = new Date();
        const end = new Date();
        end.setDate(end.getDate() + campaign.durationDays);
        campaign.endDate = end;
        campaign.status = 'active'; // Auto-activate on approval for now
    }

    await campaign.save();
    res.json(campaign);
});

// @desc    Track view/click
// @route   POST /api/campaigns/:id/track
// @access  Private
const trackCampaign = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'view' or 'click'
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
        res.status(404);
        throw new Error('Campaign not found');
    }

    if (type === 'view') {
        campaign.views += 1;
    } else if (type === 'click') {
        campaign.clicks += 1;
        // Optionally add tracking of WHO clicked if not already tracked
        if (!campaign.leads.includes(req.user._id)) {
            campaign.leads.push(req.user._id);
        }
    }

    await campaign.save();
    res.json({ message: 'Tracked' });
});

module.exports = {
    createCampaign,
    getMyCampaigns,
    getAllCampaigns,
    updateCampaignStatus,
    trackCampaign
};
