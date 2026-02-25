const CurrentAffair = require('../models/CurrentAffair');

// Auto Categorization Logic
const autoCategorize = (text) => {
    const lowerText = text.toLowerCase();

    const keywords = {
        'Polity': ['constitution', 'parliament', 'article', 'act', 'bill', 'supreme court', 'high court', 'election', 'government', 'ministry', 'cabinet', 'president', 'governor', 'fundamental rights', 'democracy', 'lok sabha', 'rajya sabha'],
        'Economy': ['gdp', 'inflation', 'rbi', 'bank', 'tax', 'budget', 'finance', 'sensex', 'nifty', 'trade', 'export', 'import', 'upi', 'digital rupee', 'gst', 'fiscal', 'monetary', 'economy'],
        'Science & Technology': ['isro', 'nasa', 'satellite', 'ai', 'artificial intelligence', 'vaccine', 'virus', 'disease', 'rocket', 'space', 'tech', '5g', '6g', 'cyber', 'drdo', 'science', 'technology'],
        'Environment': ['climate', 'carbon', 'forest', 'wildlife', 'tiger', 'elephant', 'pollution', 'river', 'ocean', 'solar', 'renewable', 'energy', 'green', 'global warming', 'cop28', 'cop29'],
        'International Relations': ['un', 'wto', 'bilateral', 'treaty', 'summit', 'g20', 'g7', 'brics', 'usa', 'china', 'russia', 'pakistan', 'border', 'agreement', 'diplomacy', 'foreign'],
        'Government Schemes': ['pm', 'cm', 'yojana', 'scheme', 'mission', 'abhiyan', 'program', 'subsidy', 'welfare', 'pradhan mantri', 'mukhya mantri'],
        'Karnataka State Affairs': ['karnataka', 'bengaluru', 'kannada', 'kpsc', 'mysuru', 'hubballi', 'belagavi', 'cm', 'state govt', 'siddaramaiah', 'basavaraj'],
        'Sports': ['cricket', 'football', 'olympics', 'asian games', 'commonwealth', 'medal', 'trophy', 'cup', 'gold', 'silver', 'bronze', 'player', 'athlete', 'bcci', 'icc'],
        'Awards': ['award', 'prize', 'nobel', 'bharat ratna', 'padma', 'honor', 'recognition'],
        'Appointments': ['appointed', 'ceo', 'chairman', 'director', 'officer', 'ias', 'ips', 'resigned', 'took charge']
    };

    let scores = {};
    let maxScore = 0;
    let bestCategory = 'Miscellaneous'; // Default

    for (const [category, words] of Object.entries(keywords)) {
        let score = 0;
        words.forEach(word => {
            if (lowerText.includes(word)) {
                score++;
            }
        });
        if (score > 0) {
            scores[category] = score;
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }
    }

    // Determine secondary category if close score
    let secondaryCategory = null;
    for (const [category, score] of Object.entries(scores)) {
        if (category !== bestCategory && score >= maxScore * 0.5 && score > 0) {
            secondaryCategory = category;
            break; // Just take one
        }
    }

    return { primaryCategory: bestCategory, secondaryCategory };
};

// @desc    Add new Current Affair
// @route   POST /api/current-affairs/admin/add
// @access  Admin
const addEntry = async (req, res) => {
    try {
        const { title, shortSummary, fullSummary, source, primaryCategory, secondaryCategory, examRelevance, difficulty, status, date, pdfUrl } = req.body;

        let finalPrimary = primaryCategory;
        let finalSecondary = secondaryCategory;

        // Auto Categorize if not provided
        if (!finalPrimary || finalPrimary === 'Auto') {
            const combinedText = `${title} ${shortSummary} ${fullSummary}`;
            const suggestions = autoCategorize(combinedText);
            finalPrimary = suggestions.primaryCategory;
            if (!finalSecondary) {
                finalSecondary = suggestions.secondaryCategory;
            }
        }

        const entry = await CurrentAffair.create({
            title,
            shortSummary,
            fullSummary,
            source,
            primaryCategory: finalPrimary,
            secondaryCategory: finalSecondary,
            examRelevance,
            difficulty,
            status: status || 'Draft',
            date: date || Date.now(),
            pdfUrl,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: entry,
            autoCategorized: !primaryCategory
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all entries (Public/User) with filters
// @route   GET /api/current-affairs
// @access  Public
const getAllEntries = async (req, res) => {
    try {
        const { category, dateFilter, exam, status } = req.query;
        let query = {};

        // Status Filter (Default to Publish for public)
        if (status) {
            query.status = status;
        } else {
            // If not requested by admin (filtered usually), default to Publish
            // Assuming admin might request 'Draft' explicitly
            // For now, let's show all if admin, or handle in frontend. 
            // Better: Public route defaults to Publish. Admin route can pass ?status=Draft
            query.status = 'Publish';
        }

        // Date Filter (Today, Yesterday, Week)
        if (dateFilter) {
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
        }

        // Category Filter
        if (category && category !== 'All') {
            // Check both primary and secondary
            query.$or = [
                { primaryCategory: category },
                { secondaryCategory: category }
            ];
        }

        // Exam Filter (Explicit)
        if (exam) {
            query.relatedExams = { $in: [exam] };
        }

        const entries = await CurrentAffair.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('createdBy', 'name');

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
            { new: true, runValidators: true }
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

// @desc    Get Single Entry
// @route   GET /api/current-affairs/:id
// @access  Public
const getEntryById = async (req, res) => {
    try {
        const entry = await CurrentAffair.findById(req.params.id).populate('createdBy', 'name');
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json(entry);
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
    markRead,
    getEntryById
};
