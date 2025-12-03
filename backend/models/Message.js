const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying by club and date
MessageSchema.index({ club: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);


