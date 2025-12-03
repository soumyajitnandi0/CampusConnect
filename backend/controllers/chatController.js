const Message = require('../models/Message');
const Club = require('../models/Club');
const User = require('../models/User');

// Send message to club chat
exports.sendMessage = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const { clubId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ msg: 'Message cannot be empty' });
        }

        // Verify club exists
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Verify user is following the club or is the organizer
        const isOrganizer = club.organizer.toString() === req.user.id;
        const isFollower = club.followers.includes(req.user.id);

        if (!isOrganizer && !isFollower) {
            return res.status(403).json({ msg: 'You must follow the club to send messages' });
        }

        // Create message
        const newMessage = new Message({
            club: clubId,
            user: req.user.id,
            message: message.trim(),
        });

        await newMessage.save();
        await newMessage.populate('user', 'name email');

        res.json(newMessage);
    } catch (err) {
        console.error('Send Message Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get messages for a club
exports.getMessages = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const { clubId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before; // For pagination

        // Verify club exists
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Verify user is following the club or is the organizer
        const isOrganizer = club.organizer.toString() === req.user.id;
        const isFollower = club.followers.includes(req.user.id);

        if (!isOrganizer && !isFollower) {
            return res.status(403).json({ msg: 'You must follow the club to view messages' });
        }

        // Build query
        let query = { club: clubId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        // Get messages
        const messages = await Message.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Reverse to show oldest first (for chat UI)
        res.json(messages.reverse());
    } catch (err) {
        console.error('Get Messages Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Delete message (only by sender or organizer)
exports.deleteMessage = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const { messageId } = req.params;

        const message = await Message.findById(messageId).populate('club');
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if user is the sender or the club organizer
        const isSender = message.user.toString() === req.user.id;
        const isOrganizer = message.club.organizer.toString() === req.user.id;

        if (!isSender && !isOrganizer) {
            return res.status(403).json({ msg: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ msg: 'Message deleted successfully' });
    } catch (err) {
        console.error('Delete Message Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};


