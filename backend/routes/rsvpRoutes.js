const express = require('express');
const router = express.Router();
const RSVP = require('../models/RSVP');
const auth = require('../middleware/auth');

// Get user's RSVPs
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const rsvps = await RSVP.find({ user: req.params.userId })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(rsvps);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get event's RSVPs
router.get('/event/:eventId', auth, async (req, res) => {
    try {
        const rsvps = await RSVP.find({ event: req.params.eventId, status: 'going' })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(rsvps);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;

