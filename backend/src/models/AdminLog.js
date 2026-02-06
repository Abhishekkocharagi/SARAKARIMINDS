const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String, // e.g., 'REVOKE_VERIFICATION', 'BLOCK_USER', etc.
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    details: {
        type: String
    },
    reason: {
        type: String
    }
}, {
    timestamps: true
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;
