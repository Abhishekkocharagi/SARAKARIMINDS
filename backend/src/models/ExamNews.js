const mongoose = require('mongoose');

const examNewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    hashtags: [{
        type: String,
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'published'
    },
    views: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const ExamNews = mongoose.model('ExamNews', examNewsSchema);

module.exports = ExamNews;
