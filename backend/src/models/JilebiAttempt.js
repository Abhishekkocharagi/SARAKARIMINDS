const mongoose = require('mongoose');

const jilebiAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    puzzleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JilebiPuzzle',
        required: true
    },
    status: {
        type: String,
        enum: ['correct', 'wrong'],
        required: true
    },
    userAnswer: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Prevent multiple attempts for the same puzzle by same user
jilebiAttemptSchema.index({ userId: 1, puzzleId: 1 }, { unique: true });

module.exports = mongoose.model('JilebiAttempt', jilebiAttemptSchema);
