const mongoose = require('mongoose');

const currentAffairSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['National', 'Karnataka', 'International', 'Economy', 'Science & Tech', 'Polity', 'Sports', 'Awards', 'Appointments', 'Other'],
        default: 'National'
    },
    relatedExams: [{
        type: String
    }],
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
currentAffairSchema.index({ date: -1, category: 1 });

const CurrentAffair = mongoose.model('CurrentAffair', currentAffairSchema);

module.exports = CurrentAffair;
