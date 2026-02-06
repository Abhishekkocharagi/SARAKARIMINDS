const express = require('express');
const router = express.Router();
const {
    createExam,
    updateExam,
    getExams,
    addJobUpdate,
    addDocument,
    linkMentorAcademy,
    getExamAnalytics,
    getVerifiedAcademies
} = require('../controllers/adminExamController');
const { protect, admin } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, admin, getExams)
    .post(protect, admin, createExam);

router.route('/:id')
    .put(protect, admin, updateExam);

router.post('/updates', protect, admin, addJobUpdate);
router.post('/documents', protect, admin, upload.single('file'), addDocument);
router.post('/upload-image', protect, admin, upload.single('file'), (req, res) => {
    if (req.file) {
        // req.file.path is already the full Cloudinary URL
        res.json({ fileUrl: req.file.path });
    } else {
        res.status(400).json({ message: 'No file uploaded' });
    }
});
router.get('/academies/verified', protect, admin, getVerifiedAcademies);
router.put('/:id/link', protect, admin, linkMentorAcademy);
router.get('/:id/analytics', protect, admin, getExamAnalytics);

module.exports = router;
