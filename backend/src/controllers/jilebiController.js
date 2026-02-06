const JilebiPuzzle = require('../models/JilebiPuzzle');
const User = require('../models/User');
const JilebiAttempt = require('../models/JilebiAttempt');
const QuizQuestion = require('../models/QuizQuestion');

// @desc    Add new Jilebi puzzle
// @route   POST /api/admin/jilebi
// @access  Admin
exports.addJilebiPuzzle = async (req, res) => {
    try {
        const { puzzleType, question, options, correctAnswer, explanation, difficulty, activeDate, isActive } = req.body;

        // If isActive is true, ensure no other active puzzles for this date
        if (isActive === true || isActive === 'true') {
            await JilebiPuzzle.updateMany({ activeDate }, { isActive: false });
        }

        const puzzle = await JilebiPuzzle.create({
            puzzleType,
            question,
            options: Array.isArray(options) ? options : (typeof options === 'string' ? JSON.parse(options) : []),
            correctAnswer,
            explanation,
            difficulty,
            activeDate,
            isActive: isActive === 'true' || isActive === true,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'ಜಲೇಬಿ ಪಜಲ್ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!', puzzle });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Jilebi puzzle
// @route   PUT /api/admin/jilebi/:id
// @access  Admin
exports.updateJilebiPuzzle = async (req, res) => {
    try {
        const { isActive, activeDate } = req.body;

        // If setting to active, deactivate others for that date
        if (isActive === true || isActive === 'true') {
            const dateToCheck = activeDate || (await JilebiPuzzle.findById(req.params.id)).activeDate;
            await JilebiPuzzle.updateMany({ activeDate: dateToCheck }, { isActive: false });
        }

        const puzzle = await JilebiPuzzle.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!puzzle) {
            return res.status(404).json({ message: 'Puzzle not found' });
        }

        res.json({ success: true, message: 'ಪಜಲ್ ನವೀಕರಿಸಲಾಗಿದೆ!', puzzle });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all Jilebi puzzles for admin
// @route   GET /api/admin/jilebi
// @access  Admin
exports.getAllJilebiPuzzles = async (req, res) => {
    try {
        const puzzles = await JilebiPuzzle.find().sort({ activeDate: -1, createdAt: -1 });
        res.json(puzzles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Jilebi puzzle
// @route   DELETE /api/admin/jilebi/:id
// @access  Admin
exports.deleteJilebiPuzzle = async (req, res) => {
    try {
        await JilebiPuzzle.findByIdAndDelete(req.params.id);
        res.json({ message: 'ಜಲೇಬಿ ಪಜಲ್ ತೆಗೆದುಹಾಕಲಾಗಿದೆ' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get today's Jilebi puzzles
// @route   GET /api/jilebi/today
// @access  Private
exports.getTodayJilebiPuzzles = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const puzzles = await JilebiPuzzle.find({ activeDate: today, isActive: true });

        if (puzzles.length === 0) {
            return res.status(404).json({ message: 'ಇಂದಿನ ಜಲೇಬಿ ಪಜಲ್ಸ್ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ!' });
        }

        // Check attempts for each puzzle
        const puzzleWithStatus = await Promise.all(puzzles.map(async (p) => {
            const attempt = await JilebiAttempt.findOne({ userId: req.user._id, puzzleId: p._id });
            return {
                ...p.toObject(),
                attempted: !!attempt,
                attemptStatus: attempt ? attempt.status : null,
                userAnswer: attempt ? attempt.userAnswer : null
            };
        }));

        res.json(puzzleWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit Jilebi puzzle answer
// @route   POST /api/jilebi/submit
// @access  Private
exports.submitJilebiAttempt = async (req, res) => {
    try {
        const { puzzleId, userAnswer } = req.body;

        const puzzle = await JilebiPuzzle.findById(puzzleId);
        if (!puzzle) {
            return res.status(404).json({ message: 'Puzzle not found' });
        }

        const existingAttempt = await JilebiAttempt.findOne({ userId: req.user._id, puzzleId });
        if (existingAttempt) {
            return res.status(400).json({ message: 'You have already attempted this puzzle today' });
        }

        // Logic to verify answer
        let isCorrect = false;
        if (puzzle.puzzleType === 'word_connect') {
            isCorrect = String(userAnswer).trim() === String(puzzle.correctAnswer).trim();
        } else if (puzzle.puzzleType === 'sequence') {
            isCorrect = JSON.stringify(userAnswer) === JSON.stringify(puzzle.correctAnswer);
        } else {
            isCorrect = String(userAnswer).toLowerCase().trim() === String(puzzle.correctAnswer).toLowerCase().trim();
        }

        const attempt = await JilebiAttempt.create({
            userId: req.user._id,
            puzzleId,
            status: isCorrect ? 'correct' : 'wrong',
            userAnswer
        });


        const updatedUser = await User.findById(req.user._id);

        res.json({
            isCorrect,
            explanation: puzzle.explanation,
            correctAnswer: puzzle.correctAnswer
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
