const mongoose = require('mongoose');

// 1. The Word Bank
const wordPathWordSchema = new mongoose.Schema({
    word: { type: String, required: true, uppercase: true },
    category: { type: String, enum: ['English', 'Polity'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    explanation: { type: String, required: true } // Kannada explanation
}, { timestamps: true });

// 2. Daily Challenge Selection & Generated Puzzle
const wordPathDailySchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WordPathWord' }],
    selectedWord: { type: mongoose.Schema.Types.ObjectId, ref: 'WordPathWord' },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
    grid: [{
        letter: String,
        r: Number,
        c: Number,
        isHole: { type: Boolean, default: false }, // If we want some empty cells
        isCheckpoint: { type: Boolean, default: false },
        checkpointIndex: { type: Number, default: null }
    }],
    correctPath: [{ r: Number, c: Number }], // The Hamiltonian path
    targetWordIndices: [Number], // Which steps in the path correspond to the letters of the selected word
}, { timestamps: true });

// 3. User Attempts
const wordPathAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dailyId: { type: mongoose.Schema.Types.ObjectId, ref: 'WordPathDaily', required: true },
    userPath: [{ r: Number, c: Number }],
    status: { type: String, enum: ['correct', 'wrong'], required: true },
    duration: Number, // seconds
    date: { type: String, required: true } // YYYY-MM-DD for checking daily limit
}, { timestamps: true });

wordPathAttemptSchema.index({ userId: 1, date: 1 }, { unique: true });

const WordPathWord = mongoose.model('WordPathWord', wordPathWordSchema);
const WordPathDaily = mongoose.model('WordPathDaily', wordPathDailySchema);
const WordPathAttempt = mongoose.model('WordPathAttempt', wordPathAttemptSchema);

module.exports = { WordPathWord, WordPathDaily, WordPathAttempt };
