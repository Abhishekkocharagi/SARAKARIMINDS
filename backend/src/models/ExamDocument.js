const mongoose = require('mongoose');

const examDocumentSchema = mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Notification', 'Syllabus', 'Cut-off', 'Result', 'Previous Paper', 'Other'],
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    examTag: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

examDocumentSchema.index({ exam: 1 });
examDocumentSchema.index({ examTag: 1 });

const ExamDocument = mongoose.model('ExamDocument', examDocumentSchema);
module.exports = ExamDocument;
