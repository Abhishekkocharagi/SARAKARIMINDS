const mongoose = require('mongoose');

const connectionSchema = mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;
