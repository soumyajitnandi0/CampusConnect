const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Password not required for Google Auth users
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['student', 'organizer'], default: 'student' },
    rollNo: { type: String }, // For students
    yearSection: { type: String }, // For students
    points: { type: Number, default: 0 },
    badges: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
