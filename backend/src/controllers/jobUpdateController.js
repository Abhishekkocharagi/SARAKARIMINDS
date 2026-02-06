const asyncHandler = require('express-async-handler');
const JobUpdate = require('../models/JobUpdate');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a job update
// @route   POST /api/admin/job-updates
// @access  Private/Admin
const createJobUpdate = asyncHandler(async (req, res) => {
    const { title, organization, description, eligibility, location, hashtags: rawHashtags, notificationType, applicationLink } = req.body;
    const hashtags = Array.isArray(rawHashtags) ? rawHashtags : (rawHashtags ? rawHashtags.split(',').map(tag => tag.trim()) : []);

    if (!title || !organization || !description) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    const jobUpdate = await JobUpdate.create({
        title,
        organization,
        description,
        eligibility,
        location,
        hashtags,
        applicationLink: applicationLink || '',
        notificationType: notificationType || 'matching',
        createdBy: req.user._id
    });

    console.log(`[JobUpdate] Job Published: ID=${jobUpdate._id}, Title=${jobUpdate.title}`);
    console.log(`[JobUpdate] Raw Hashtags: ${hashtags.join(', ')}`);

    // --- Notification Logic ---
    try {
        let usersToNotify = [];

        if (notificationType === 'all') {
            usersToNotify = await User.find({ _id: { $ne: req.user._id } }).select('_id name');
            console.log(`[JobUpdate] Scope: ALL. Total users found: ${usersToNotify.length}`);
        } else {
            // STRICT MATCHING LOGIC
            // 1. Normalize Job Hashtags: UpperCase, No #, Trim
            const normalizedJobTags = hashtags.map(tag => tag.replace(/#/g, '').trim().toUpperCase());
            console.log(`[JobUpdate] Normalized Job Tags: ${normalizedJobTags.join(', ')}`);

            // 2. Fetch all users who have exams selected (scan all potential candidates)
            const allUsers = await User.find({ exams: { $exists: true, $not: { $size: 0 } } }).select('_id name exams');
            console.log(`[JobUpdate] Total users with exams scanned: ${allUsers.length}`);

            // 3. Filter Eligible Users
            usersToNotify = allUsers.filter(user => {
                if (!user.exams || !Array.isArray(user.exams)) return false;

                // Normalize User Exams
                const userExams = user.exams.map(e => e.replace(/#/g, '').trim().toUpperCase());

                // Check Intersection
                const hasMatch = normalizedJobTags.some(tag => userExams.includes(tag));

                if (hasMatch) {
                    // console.log(`[JobUpdate] Match found for ${user.name}: [${userExams}] matches [${normalizedJobTags}]`);
                }
                return hasMatch;
            });
        }

        console.log(`[JobUpdate] Final Eligible Users: ${usersToNotify.length}`);

        if (usersToNotify.length > 0) {
            const notifications = usersToNotify.map(user => ({
                recipient: user._id,
                sender: req.user._id, // Admin
                type: 'job_update',
                title: 'Job matching your profile',
                message: `Hi ${user.name}, a new job matching your exam profile has been posted.`,
                link: `/job-updates/${jobUpdate._id}`, // Can be handled by frontend to open modal or page
                jobUpdate: jobUpdate._id,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await Notification.insertMany(notifications);
            console.log(`[JobUpdate] SUCCESS: Created ${notifications.length} notifications.`);
        } else {
            console.log(`[JobUpdate] WARNING: Zero users matched. No notifications sent.`);
        }

    } catch (error) {
        console.error(`[JobUpdate] CRITICAL Notification Error: ${error.message}`);
    }

    res.status(201).json(jobUpdate);
});

// @desc    Get all job updates
// @route   GET /api/admin/job-updates
// @access  Private/Admin
const getAllJobUpdates = asyncHandler(async (req, res) => {
    const jobs = await JobUpdate.find({}).sort({ createdAt: -1 });
    res.json(jobs);
});

// @desc    Delete a job update
// @route   DELETE /api/admin/job-updates/:id
// @access  Private/Admin
const deleteJobUpdate = asyncHandler(async (req, res) => {
    const job = await JobUpdate.findById(req.params.id);

    if (job) {
        await job.deleteOne();
        res.json({ message: 'Job removed' });
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

// @desc    Get job update by ID (Public)
// @route   GET /api/jobs/:id
// @access  Public
const getJobUpdateById = asyncHandler(async (req, res) => {
    const job = await JobUpdate.findById(req.params.id).populate('createdBy', 'name');

    if (job) {
        res.json(job);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

// @desc    Get all job updates (Public)
// @route   GET /api/jobs
// @access  Public
const getPublicJobUpdates = asyncHandler(async (req, res) => {
    const jobs = await JobUpdate.find({}).sort({ createdAt: -1 });
    res.json(jobs);
});

// @desc    Update a job update
// @route   PUT /api/admin/job-updates/:id
// @access  Private/Admin
const updateJobUpdate = asyncHandler(async (req, res) => {
    const { title, organization, description, eligibility, location, hashtags: rawHashtags, notificationType, applicationLink } = req.body;
    const hashtags = Array.isArray(rawHashtags) ? rawHashtags : (rawHashtags ? rawHashtags.split(',').map(tag => tag.trim()) : []);

    const job = await JobUpdate.findById(req.params.id);

    if (job) {
        job.title = title || job.title;
        job.organization = organization || job.organization;
        job.description = description || job.description;
        job.eligibility = eligibility || job.eligibility;
        job.location = location || job.location;
        job.hashtags = hashtags.length > 0 ? hashtags : job.hashtags;
        job.applicationLink = applicationLink !== undefined ? applicationLink : job.applicationLink;
        job.notificationType = notificationType || job.notificationType;

        const updatedJob = await job.save();
        res.json(updatedJob);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

module.exports = {
    createJobUpdate,
    getAllJobUpdates,
    deleteJobUpdate,
    getJobUpdateById,
    getPublicJobUpdates,
    updateJobUpdate
};
