const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    event: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        required: true 
    },
    checkInTime: { 
        type: Date, 
        default: Date.now,
        required: true
    },
    qrData: {
        userId: String,
        eventId: String,
        timestamp: Number,
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create index to prevent duplicate check-ins
CheckInSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', CheckInSchema);

