const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// Send notification to event attendees
router.post('/event/:eventId', auth, requireRole('organizer'), async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, body, data } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Get all users who RSVP'd to this event
        const rsvps = await RSVP.find({ event: eventId, status: 'going' });
        const userIds = rsvps.map(rsvp => rsvp.user);
        
        // Get push tokens
        const users = await User.find({ _id: { $in: userIds }, pushToken: { $exists: true, $ne: null } });
        const pushTokens = users.map(user => user.pushToken).filter(Boolean);

        // In a real app, you would send push notifications here using Expo Push Notification service
        // For now, we'll just return success
        // TODO: Integrate with Expo Push Notification service

        res.json({
            msg: 'Notification sent',
            recipients: pushTokens.length,
            pushTokens, // For development/testing
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Send notification to specific user
router.post('/user/:userId', auth, requireRole('organizer'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { title, body, data } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.pushToken) {
            return res.status(404).json({ msg: 'User not found or has no push token' });
        }

        // In a real app, send push notification here
        // TODO: Integrate with Expo Push Notification service

        res.json({
            msg: 'Notification sent',
            pushToken: user.pushToken,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;

