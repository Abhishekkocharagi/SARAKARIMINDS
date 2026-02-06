const mongoose = require('mongoose');

const jilebiPuzzleSchema = new mongoose.Schema({
    puzzleType: {
        type: String,
        enum: ['sequence', 'pattern', 'word_connect', 'logic_grid', 'visual'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    explanation: {
        type: String,
        required: true
    }, // Kannada explanation
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    activeDate: {
        type: String,
        required: true
    }, // YYYY-MM-DD
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Ensure only one active main puzzle per day per type (if multiple types allowed daily)
// The user specifically asked for "only one active puzzle per day"
jilebiPuzzleSchema.index({ activeDate: 1, isActive: 1 });

module.exports = mongoose.model('JilebiPuzzle', jilebiPuzzleSchema);
