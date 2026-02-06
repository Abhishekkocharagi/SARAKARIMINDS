const mongoose = require('mongoose');

const communityGroupSchema = mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
        type: String,
        enum: ['announcement', 'discussion'],
        default: 'discussion'
    }
}, { timestamps: true });

module.exports = mongoose.model('CommunityGroup', communityGroupSchema);
