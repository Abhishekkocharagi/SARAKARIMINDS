const mongoose = require('mongoose');

const examJobUpdateSchema = mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    type: {
        type: String,
        enum: ['Vacancy', 'Admit Card', 'Result'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    examTag: {
        type: String, // e.g., 'KAS'
        required: true
    },
    dates: {
        applicationStart: Date,
        applicationEnd: Date,
        examDate: Date,
        resultDate: Date
    },
    links: [{
        label: String,
        url: String
    }],
    pdfs: [{
        name: String,
        url: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publisherName: {
        type: String,
        default: 'Admin'
    }
}, { timestamps: true });

examJobUpdateSchema.index({ exam: 1 });
examJobUpdateSchema.index({ examTag: 1 });

const ExamJobUpdate = mongoose.model('ExamJobUpdate', examJobUpdateSchema);
module.exports = ExamJobUpdate;
