const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // e.g., 'KAS', 'FDA'
        trim: true
    },
    fullName: {
        type: String,
        required: true
    },
    conductingBody: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String,
        default: ''
    },
    examLevel: {
        type: String, // State, Central, etc.
        required: true
    },
    category: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    examType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    // Detailed Content
    overview: { type: String, default: '' },
    jobRole: { type: String, default: '' },
    postingDepartments: { type: String, default: '' },
    careerGrowth: { type: String, default: '' },
    salaryScale: { type: String, default: '' },
    eligibilityDetails: { type: String, default: '' },
    examPattern: { type: String, default: '' },
    syllabusSubjectWise: [{
        subject: String,
        topics: [String]
    }],

    // Associations
    verifiedMentors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verifiedAcademies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    officialCommunities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }],
    officialPartnerAcademy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    partnerAcademyLogo: {
        type: String,
        default: ''
    },

    // Analytics (Cached or managed via controller)
    aspirantCount: { type: Number, default: 0 },
    activeUserCount: { type: Number, default: 0 }

}, { timestamps: true });

examSchema.index({ category: 1 });
examSchema.index({ examLevel: 1 });

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
