const mongoose = require('mongoose');

const jobUpdateSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    description: {
        type: String, // Rich text or simple text
        required: true
    },
    eligibility: {
        type: String
    },
    location: {
        type: String
    },
    hashtags: [String], // Array of exam tags e.g., ['KPSC', 'FDA']
    applicationLink: {
        type: String,
        default: ''
    },
    notificationType: {
        type: String,
        enum: ['matching', 'all'],
        default: 'matching'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const JobUpdate = mongoose.model('JobUpdate', jobUpdateSchema);
module.exports = JobUpdate;
