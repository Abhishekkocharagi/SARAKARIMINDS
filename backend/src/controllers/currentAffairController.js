const CurrentAffair = require('../models/CurrentAffair');

// @desc    Add new Current Affair
// @route   POST /api/current-affairs/admin/add
// @access  Admin
const addEntry = async (req, res) => {
    try {
        const { title, description, category, relatedExams, date, pdfUrl } = req.body;

        const entry = await CurrentAffair.create({
            title,
            description,
            category,
            relatedExams: Array.isArray(relatedExams) ? relatedExams : (relatedExams ? [relatedExams] : []),
            date: date || Date.now(),
            pdfUrl,
            createdBy: req.user._id
        });

        res.status(201).json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all entries (Public/User) with filters
// @route   GET /api/current-affairs
// @access  Public
const getAllEntries = async (req, res) => {
    try {
        const { category, dateFilter, exam } = req.query;
        let query = {};

        // Date Filter (Today, Yesterday, Week)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
            query.date = { $gte: today };
        } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const todayStart = new Date(today);
            query.date = { $gte: yesterday, $lt: todayStart };
        } else if (dateFilter === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            query.date = { $gte: weekStart };
        }

        // Category Filter
        if (category && category !== 'All') {
            query.category = category;
        }

        // Exam Filter (Explicit)
        if (exam) {
            query.relatedExams = { $in: [exam] };
        }

        let entries = await CurrentAffair.find(query).sort({ date: -1 });

        // Personalization: If user is logged in and no specific filters are applied, prioritize their exams
        if (req.user && !category && !dateFilter && !exam) {
            const userExams = req.user.preferredExams || [];
            if (userExams.length > 0) {
                // simple sorting: put preferred exams matching entries first
                entries.sort((a, b) => {
                    const aMatch = a.relatedExams.some(e => userExams.includes(e));
                    const bMatch = b.relatedExams.some(e => userExams.includes(e));
                    return bMatch - aMatch;
                });
            }
        }

        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update entry
// @route   PUT /api/current-affairs/admin/:id
// @access  Admin
const updateEntry = async (req, res) => {
    try {
        const entry = await CurrentAffair.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const updatedEntry = await CurrentAffair.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedEntry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete entry
// @route   DELETE /api/current-affairs/admin/:id
// @access  Admin
const deleteEntry = async (req, res) => {
    try {
        const entry = await CurrentAffair.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        await entry.deleteOne();
        res.json({ message: 'Entry removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Toggle Save (Bookmark)
// @route   PUT /api/current-affairs/:id/save
// @access  Private
const toggleSave = async (req, res) => {
    try {
        const entry = await CurrentAffair.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        const userId = req.user._id;

        if (entry.saves.includes(userId)) {
            entry.saves = entry.saves.filter(id => id.toString() !== userId.toString());
        } else {
            entry.saves.push(userId);
        }

        await entry.save();
        res.json({ success: true, isSaved: entry.saves.includes(userId) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark as Read
// @route   PUT /api/current-affairs/:id/read
// @access  Private
const markRead = async (req, res) => {
    try {
        const entry = await CurrentAffair.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        const userId = req.user._id;

        if (!entry.reads.includes(userId)) {
            entry.reads.push(userId);
            await entry.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addEntry,
    getAllEntries,
    updateEntry,
    deleteEntry,
    toggleSave,
    markRead
};
