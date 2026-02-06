const asyncHandler = require('express-async-handler');
const Exam = require('../models/Exam');
const ExamJobUpdate = require('../models/ExamJobUpdate');
const ExamDocument = require('../models/ExamDocument');
const User = require('../models/User');
const Community = require('../models/Community');

// @desc    Get all active exams
// @route   GET /api/exams
// @access  Public
const getExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({ status: 'active' })
        .select('name fullName conductingBody category examLevel logoUrl');

    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const normalizedExams = exams.map(exam => {
        const e = exam.toObject();
        if (e.logoUrl && !e.logoUrl.startsWith('http')) {
            e.logoUrl = baseUrl + e.logoUrl.replace(/\\/g, '/');
        }
        return e;
    });

    res.json(normalizedExams);
});

// @desc    Get exam details by Name (Tag)
// @route   GET /api/exams/:name
// @access  Public
const getExamDetails = asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ name: req.params.name })
        .populate('verifiedMentors', 'name profilePic about')
        .populate('verifiedAcademies', 'name profilePic academyDetails')
        .populate('officialPartnerAcademy', 'name profilePic academyDetails');

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const updates = await ExamJobUpdate.find({ exam: exam._id }).sort({ createdAt: -1 });
    const documents = await ExamDocument.find({ exam: exam._id }).sort({ createdAt: -1 });
    const communities = await Community.find({ category: exam.name, status: 'active' });

    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const examObj = exam.toObject();
    if (examObj.logoUrl && !examObj.logoUrl.startsWith('http')) {
        examObj.logoUrl = baseUrl + examObj.logoUrl.replace(/\\/g, '/');
    }

    res.json({
        exam: examObj,
        updates,
        documents,
        communities
    });
});

// @desc    Select exams for user (Preferred)
// @route   POST /api/exams/select
// @access  Private
const selectExams = asyncHandler(async (req, res) => {
    const { preferredExamIds, receiveAllNotifications } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (preferredExamIds) {
        if (preferredExamIds.length > 5) {
            res.status(400);
            throw new Error('Maximum 5 preferred exams allowed');
        }
        user.preferredExams = preferredExamIds;

        // Synchronize with legacy fields for consistency across features (e.g., Exam News)
        const selectedExamsData = await Exam.find({ _id: { $in: preferredExamIds } });
        const examNames = selectedExamsData.map(e => e.name);
        user.exams = examNames;
        user.examHashtags = examNames;
    }

    if (receiveAllNotifications !== undefined) {
        user.receiveAllNotifications = receiveAllNotifications;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate('preferredExams', 'name fullName category logoUrl');
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const normalizedPreferred = updatedUser.preferredExams.map(exam => {
        const e = exam.toObject();
        if (e.logoUrl && !e.logoUrl.startsWith('http')) {
            e.logoUrl = baseUrl + e.logoUrl.replace(/\\/g, '/');
        }
        return e;
    });

    res.json({
        message: 'Preferences updated successfully',
        preferredExams: normalizedPreferred,
        exams: updatedUser.exams,
        examHashtags: updatedUser.examHashtags,
        receiveAllNotifications: updatedUser.receiveAllNotifications
    });
});

// @desc    Get current user exam preferences
// @route   GET /api/exams/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('preferredExams');
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const normalizedPreferred = user.preferredExams.map(exam => {
        const e = exam.toObject();
        if (e.logoUrl && !e.logoUrl.startsWith('http')) {
            e.logoUrl = baseUrl + e.logoUrl.replace(/\\/g, '/');
        }
        return e;
    });

    res.json({
        preferredExams: normalizedPreferred,
        receiveAllNotifications: user.receiveAllNotifications
    });
});

module.exports = {
    getExams,
    getExamDetails,
    selectExams,
    getPreferences
};
