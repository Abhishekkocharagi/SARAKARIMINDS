const QuizQuestion = require('../models/QuizQuestion');
const User = require('../models/User');

// @desc    Add a daily quiz question (Admin only)
// @route   POST /api/quiz/admin/add
const addDailyQuestion = async (req, res) => {
    try {
        const { subject, questionText, options, correctOptionIndex } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Validation
        if (!subject || !questionText || !options || options.length !== 4 || correctOptionIndex === undefined) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }

        // Check how many questions already exist for this subject today
        const count = await QuizQuestion.countDocuments({ subject, date: today });
        if (count >= 5) {
            return res.status(400).json({ message: `Already added 5 questions for ${subject} today.` });
        }

        const question = await QuizQuestion.create({
            subject,
            questionText,
            options,
            correctOptionIndex,
            date: today,
            createdBy: req.user._id
        });

        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get daily quiz status (Admin only)
// @route   GET /api/quiz/admin/status
const getDailyStatus = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const subjects = ['General Knowledge', 'Current Affairs', 'Aptitude', 'Reasoning', 'Kannada', 'English'];

        const status = await Promise.all(subjects.map(async (sub) => {
            const count = await QuizQuestion.countDocuments({ subject: sub, date: today });
            return { subject: sub, count };
        }));

        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get today's quiz for a specific subject (User)
// @route   GET /api/quiz/:subject
const getDailyQuiz = async (req, res) => {
    try {
        const { subject } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const questions = await QuizQuestion.find({ subject, date: today }).limit(5);

        if (questions.length < 5) {
            return res.status(404).json({ message: `Today's quiz for ${subject} is not yet ready (only ${questions.length}/5 questions added)` });
        }

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a question (Admin only)
// @route   DELETE /api/quiz/admin/:id
const deleteQuestion = async (req, res) => {
    try {
        const question = await QuizQuestion.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        await question.deleteOne();
        res.json({ message: 'Question removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get today's questions for a subject (Admin - to view what's added)
// @route   GET /api/quiz/admin/today/:subject
const getTodayAdminQuestions = async (req, res) => {
    try {
        const { subject } = req.params;
        const today = new Date().toISOString().split('T')[0];
        const questions = await QuizQuestion.find({ subject, date: today });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record daily quiz completion and update streak
// @route   POST /api/quiz/complete
// @access  Private
const recordQuizCompletion = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastAttempt = user.lastDailyQuizAttemptDate ? new Date(user.lastDailyQuizAttemptDate) : null;
        if (lastAttempt) {
            lastAttempt.setHours(0, 0, 0, 0);
        }

        if (lastAttempt && lastAttempt.getTime() === today.getTime()) {
            return res.json({
                message: 'Already completed today',
                dailyQuizStreakCount: user.dailyQuizStreakCount
            });
        }

        // Logic for streak increment
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastAttempt && lastAttempt.getTime() === yesterday.getTime()) {
            user.dailyQuizStreakCount += 1;
        } else {
            user.dailyQuizStreakCount = 1;
        }

        user.lastDailyQuizAttemptDate = today;
        await user.save();

        res.json({
            success: true,
            message: 'Quiz completion recorded!',
            dailyQuizStreakCount: user.dailyQuizStreakCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addDailyQuestion,
    getDailyStatus,
    getDailyQuiz,
    deleteQuestion,
    getTodayAdminQuestions,
    recordQuizCompletion
};
