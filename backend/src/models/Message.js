const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    fileUrl: { type: String },
    fileType: { type: String },
    fileName: { type: String },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story'
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeletedForEveryone: {
        type: Boolean,
        default: false
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Custom validation: Message must have either text or a file
messageSchema.pre('validate', function () {
    if (!this.text && !this.fileUrl && !this.isDeletedForEveryone) {
        throw new Error('Message must have either text or a file attachment');
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
