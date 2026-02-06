const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        enum: ['General Knowledge', 'Current Affairs', 'Aptitude', 'Reasoning', 'Kannada', 'English']
    },
    questionText: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: [array => array.length === 4, 'Question must have exactly 4 options']
    },
    correctOptionIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    date: {
        type: String,
        required: true, // Format: YYYY-MM-DD
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
