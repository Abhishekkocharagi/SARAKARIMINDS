const mongoose = require('mongoose');

const dailyNewspaperSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'image'],
        required: true
    },
    thumbnailUrl: {
        type: String // For PDF first page preview
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for efficient querying
dailyNewspaperSchema.index({ date: -1, isVisible: 1 });

const DailyNewspaper = mongoose.model('DailyNewspaper', dailyNewspaperSchema);

module.exports = DailyNewspaper;
