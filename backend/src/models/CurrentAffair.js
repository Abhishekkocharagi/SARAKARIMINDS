const mongoose = require('mongoose');

const currentAffairSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    shortSummary: {
        type: String, // 3-5 bullet points
        required: true
    },
    fullSummary: {
        type: String, // Rich text
        required: true
    },
    source: {
        type: String,
        default: ''
    },
    primaryCategory: {
        type: String,
        required: true,
        enum: ['Polity', 'Economy', 'Science & Technology', 'Environment', 'International Relations', 'Government Schemes', 'Karnataka State Affairs', 'Miscellaneous', 'National', 'Sports', 'Awards', 'Appointments', 'Other'],
        default: 'Miscellaneous'
    },
    secondaryCategory: {
        type: String,
        enum: ['Polity', 'Economy', 'Science & Technology', 'Environment', 'International Relations', 'Government Schemes', 'Karnataka State Affairs', 'Miscellaneous', 'National', 'Sports', 'Awards', 'Appointments', 'Other'],
    },
    examRelevance: {
        type: String,
        enum: ['Prelims', 'Mains', 'Both'],
        default: 'Both'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Moderate', 'Advanced'],
        default: 'Moderate'
    },
    status: {
        type: String,
        enum: ['Draft', 'Publish'],
        default: 'Draft'
    },
    date: {
        type: Date,
        default: Date.now
    },
    pdfUrl: {
        type: String,
        default: ''
    },
    views: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    saves: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient filtering
currentAffairSchema.index({ date: -1, primaryCategory: 1, status: 1 });

const CurrentAffair = mongoose.model('CurrentAffair', currentAffairSchema);

module.exports = CurrentAffair;
