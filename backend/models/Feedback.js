const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple feedback from same user for same event
FeedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
