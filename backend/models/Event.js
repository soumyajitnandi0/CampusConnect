const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }, // Optional club reference
    qrCodeToken: { type: String }, // Signed token for QR
    rsvpCount: { type: Number, default: 0 },
    category: { type: String },
    imageUrl: { type: String },
    duration: {
        days: { type: Number, default: 0 },
        hours: { type: Number, default: 0 },
        minutes: { type: Number, default: 0 }
    },
    status: { 
        type: String, 
        enum: ['active', 'canceled', 'rescheduled'], 
        default: 'active' 
    },
    rescheduledDate: { type: Date }, // New date if event is rescheduled
    cancelReason: { type: String }, // Reason for cancellation
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
