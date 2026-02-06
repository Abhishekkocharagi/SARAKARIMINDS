const mongoose = require('mongoose');

const communityMessageSchema = mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String },
    isAnnouncement: { type: Boolean, default: false } // Redundant but helpful if group type is Checked
}, { timestamps: true });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
