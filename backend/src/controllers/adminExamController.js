const asyncHandler = require('express-async-handler');
const Exam = require('../models/Exam');
const ExamJobUpdate = require('../models/ExamJobUpdate');
const ExamDocument = require('../models/ExamDocument');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Community = require('../models/Community');

// ==========================================
// EXAM MASTER MANAGEMENT
// ==========================================

// @desc    Create new exam
// @route   POST /api/admin/exams
// @access  Private/Admin
const createExam = asyncHandler(async (req, res) => {
    const { name, fullName, conductingBody, logoUrl, examLevel, category, language, examType } = req.body;

    const examExists = await Exam.findOne({ name });
    if (examExists) {
        res.status(400);
        throw new Error('Exam already exists');
    }

    const exam = await Exam.create({
        name,
        fullName,
        conductingBody,
        logoUrl: logoUrl || '',
        examLevel,
        category,
        language,
        examType
    });

    res.status(201).json(exam);
});

// @desc    Update exam details/content
// @route   PUT /api/admin/exams/:id
// @access  Private/Admin
const updateExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        exam.name = req.body.name || exam.name;
        exam.fullName = req.body.fullName || exam.fullName;
        exam.conductingBody = req.body.conductingBody || exam.conductingBody;
        exam.logoUrl = req.body.logoUrl || exam.logoUrl;
        exam.examLevel = req.body.examLevel || exam.examLevel;
        exam.category = req.body.category || exam.category;
        exam.language = req.body.language || exam.language;
        exam.examType = req.body.examType || exam.examType;
        exam.status = req.body.status || exam.status;

        // Content updates
        exam.overview = req.body.overview || exam.overview;
        exam.jobRole = req.body.jobRole || exam.jobRole;
        exam.postingDepartments = req.body.postingDepartments || exam.postingDepartments;
        exam.careerGrowth = req.body.careerGrowth || exam.careerGrowth;
        exam.salaryScale = req.body.salaryScale || exam.salaryScale;
        exam.eligibilityDetails = req.body.eligibilityDetails || exam.eligibilityDetails;
        exam.examPattern = req.body.examPattern || exam.examPattern;
        exam.syllabusSubjectWise = req.body.syllabusSubjectWise || exam.syllabusSubjectWise;

        // Branding
        if (req.body.officialPartnerAcademy !== undefined) {
            exam.officialPartnerAcademy = req.body.officialPartnerAcademy === "" ? null : req.body.officialPartnerAcademy;
        }
        if (req.body.partnerAcademyLogo !== undefined) {
            exam.partnerAcademyLogo = req.body.partnerAcademyLogo;
        }

        const updatedExam = await exam.save();
        res.json(updatedExam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Get all exams (Admin view)
// @route   GET /api/admin/exams
// @access  Private/Admin
const getExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({}).populate('officialPartnerAcademy', 'name profilePic');
    res.json(exams);
});

// ==========================================
// JOB UPDATES (Exam-wise)
// ==========================================

// @desc    Add Job Update
// @route   POST /api/admin/exams/updates
// @access  Private/Admin
const addJobUpdate = asyncHandler(async (req, res) => {
    const { examId, type, title, description, examTag, dates, links, pdfs, publisherName } = req.body;

    const update = await ExamJobUpdate.create({
        exam: examId,
        type,
        title,
        description,
        examTag,
        dates,
        links,
        pdfs,
        createdBy: req.user._id,
        publisherName: publisherName || (req.user.role === 'admin' ? 'Admin' : req.user.name)
    });

    // NOTIFICATION LOGIC
    // Notify users who selected this exam as preferred OR opted into all notifications
    const users = await User.find({
        $or: [
            { preferredExams: examId },
            { receiveAllNotifications: true }
        ]
    });

    const notifications = users.map(user => ({
        recipient: user._id,
        sender: req.user._id,
        type: 'job_update',
        title: `${type}: ${title}`,
        message: `New ${type} update for ${examTag}: ${title}`,
        jobUpdate: update._id,
        link: `/exams/${examTag}?tab=updates`
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    res.status(201).json(update);
});

// ==========================================
// HELPERS
// ==========================================

// @desc    Get verified academies for linking
// @route   GET /api/admin/exams/academies/verified
// @access  Private/Admin
const getVerifiedAcademies = asyncHandler(async (req, res) => {
    const academies = await User.find({
        role: 'academy',
        academyApplicationStatus: 'approved'
    }).select('name academyDetails profilePic');
    res.json(academies);
});

// @desc    Add Official Document
// @route   POST /api/admin/exams/documents
// @access  Private/Admin
const addDocument = asyncHandler(async (req, res) => {
    const { examId, title, category, examTag } = req.body;
    const fileUrl = req.file ? req.file.path : req.body.fileUrl;

    if (!fileUrl) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const document = await ExamDocument.create({
        exam: examId,
        title,
        category,
        fileUrl,
        examTag,
        uploadedBy: req.user._id
    });

    res.status(201).json(document);
});

// @desc    Link Mentor/Academy to Exam
// @route   PUT /api/admin/exams/:id/link
// @access  Private/Admin
const linkMentorAcademy = asyncHandler(async (req, res) => {
    const { mentorIds, academyIds } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        if (mentorIds) exam.verifiedMentors = mentorIds;
        if (academyIds) exam.verifiedAcademies = academyIds;

        const updatedExam = await exam.save();
        res.json(updatedExam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Get Exam Analytics
// @route   GET /api/admin/exams/:id/analytics
// @access  Private/Admin
const getExamAnalytics = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const totalAspirants = await User.countDocuments({ exams: exam.name });
    const jobUpdatesCount = await ExamJobUpdate.countDocuments({ exam: exam._id });
    const documentsCount = await ExamDocument.countDocuments({ exam: exam._id });

    // Notification reach
    const notificationReach = await Notification.countDocuments({
        type: 'job_update',
        message: { $regex: exam.name, $options: 'i' }
    });

    res.json({
        totalAspirants,
        jobUpdatesCount,
        documentsCount,
        notificationReach
    });
});

module.exports = {
    createExam,
    updateExam,
    getExams,
    addJobUpdate,
    addDocument,
    linkMentorAcademy,
    getExamAnalytics,
    getVerifiedAcademies
};
