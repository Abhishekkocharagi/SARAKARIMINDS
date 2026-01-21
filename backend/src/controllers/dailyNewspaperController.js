const DailyNewspaper = require('../models/DailyNewspaper');

// @desc    Get all visible newspapers (for users)
// @route   GET /api/daily-newspapers
// @access  Private
exports.getNewspapers = async (req, res) => {
    try {
        const newspapers = await DailyNewspaper.find({ isVisible: true })
            .sort({ date: -1 })
            .populate('uploadedBy', 'name')
            .lean();

        res.json(newspapers);
    } catch (error) {
        console.error('Error fetching newspapers:', error);
        res.status(500).json({ message: 'Failed to fetch newspapers' });
    }
};

// @desc    Get all newspapers (for admin)
// @route   GET /api/admin/daily-newspapers
// @access  Private/Admin
exports.getAllNewspapers = async (req, res) => {
    try {
        const newspapers = await DailyNewspaper.find()
            .sort({ date: -1 })
            .populate('uploadedBy', 'name email')
            .lean();

        res.json(newspapers);
    } catch (error) {
        console.error('Error fetching all newspapers:', error);
        res.status(500).json({ message: 'Failed to fetch newspapers' });
    }
};

// @desc    Get single newspaper
// @route   GET /api/daily-newspapers/:id
// @access  Private
exports.getNewspaperById = async (req, res) => {
    try {
        const newspaper = await DailyNewspaper.findById(req.params.id)
            .populate('uploadedBy', 'name');

        if (!newspaper) {
            return res.status(404).json({ message: 'Newspaper not found' });
        }

        res.json(newspaper);
    } catch (error) {
        console.error('Error fetching newspaper:', error);
        res.status(500).json({ message: 'Failed to fetch newspaper' });
    }
};

// @desc    Create newspaper
// @route   POST /api/admin/daily-newspapers
// @access  Private/Admin
exports.createNewspaper = async (req, res) => {
    try {
        const { name, date, fileUrl, fileType, thumbnailUrl } = req.body;

        if (!name || !fileUrl || !fileType) {
            return res.status(400).json({ message: 'Please provide name, fileUrl, and fileType' });
        }

        const newspaper = await DailyNewspaper.create({
            name,
            date: date || new Date(),
            fileUrl,
            fileType,
            thumbnailUrl,
            uploadedBy: req.user._id
        });

        const populatedNewspaper = await DailyNewspaper.findById(newspaper._id)
            .populate('uploadedBy', 'name email');

        res.status(201).json(populatedNewspaper);
    } catch (error) {
        console.error('Error creating newspaper:', error);
        res.status(500).json({ message: 'Failed to create newspaper' });
    }
};

// @desc    Update newspaper
// @route   PUT /api/admin/daily-newspapers/:id
// @access  Private/Admin
exports.updateNewspaper = async (req, res) => {
    try {
        const { name, date, fileUrl, fileType, thumbnailUrl, isVisible } = req.body;

        const newspaper = await DailyNewspaper.findById(req.params.id);

        if (!newspaper) {
            return res.status(404).json({ message: 'Newspaper not found' });
        }

        // Update fields
        if (name !== undefined) newspaper.name = name;
        if (date !== undefined) newspaper.date = date;
        if (fileUrl !== undefined) newspaper.fileUrl = fileUrl;
        if (fileType !== undefined) newspaper.fileType = fileType;
        if (thumbnailUrl !== undefined) newspaper.thumbnailUrl = thumbnailUrl;
        if (isVisible !== undefined) newspaper.isVisible = isVisible;

        await newspaper.save();

        const updatedNewspaper = await DailyNewspaper.findById(newspaper._id)
            .populate('uploadedBy', 'name email');

        res.json(updatedNewspaper);
    } catch (error) {
        console.error('Error updating newspaper:', error);
        res.status(500).json({ message: 'Failed to update newspaper' });
    }
};

// @desc    Delete newspaper
// @route   DELETE /api/admin/daily-newspapers/:id
// @access  Private/Admin
exports.deleteNewspaper = async (req, res) => {
    try {
        const newspaper = await DailyNewspaper.findById(req.params.id);

        if (!newspaper) {
            return res.status(404).json({ message: 'Newspaper not found' });
        }

        await newspaper.deleteOne();

        res.json({ message: 'Newspaper deleted successfully' });
    } catch (error) {
        console.error('Error deleting newspaper:', error);
        res.status(500).json({ message: 'Failed to delete newspaper' });
    }
};

// @desc    Record newspaper view
// @route   POST /api/daily-newspapers/:id/view
// @access  Private
exports.recordView = async (req, res) => {
    try {
        const newspaper = await DailyNewspaper.findById(req.params.id);

        if (!newspaper) {
            return res.status(404).json({ message: 'Newspaper not found' });
        }

        // Add user to views if not already present
        if (!newspaper.views.includes(req.user._id)) {
            newspaper.views.push(req.user._id);
            await newspaper.save();
        }

        res.json({ message: 'View recorded' });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ message: 'Failed to record view' });
    }
};

// @desc    Toggle newspaper visibility
// @route   PATCH /api/admin/daily-newspapers/:id/toggle-visibility
// @access  Private/Admin
exports.toggleVisibility = async (req, res) => {
    try {
        const newspaper = await DailyNewspaper.findById(req.params.id);

        if (!newspaper) {
            return res.status(404).json({ message: 'Newspaper not found' });
        }

        newspaper.isVisible = !newspaper.isVisible;
        await newspaper.save();

        const updatedNewspaper = await DailyNewspaper.findById(newspaper._id)
            .populate('uploadedBy', 'name email');

        res.json(updatedNewspaper);
    } catch (error) {
        console.error('Error toggling visibility:', error);
        res.status(500).json({ message: 'Failed to toggle visibility' });
    }
};
