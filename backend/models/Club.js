const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followerCount: { type: Number, default: 0 },
    category: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ClubSchema.pre('save', async function() {
    this.updatedAt = Date.now();
    if (this.isModified('followers')) {
        this.followerCount = this.followers ? this.followers.length : 0;
    }
});

module.exports = mongoose.model('Club', ClubSchema);

