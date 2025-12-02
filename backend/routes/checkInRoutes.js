const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// Get all check-ins for an event
router.get('/event/:eventId', auth, requireRole('organizer'), async (req, res) => {
    try {
        const { eventId } = req.params;
        const checkIns = await CheckIn.find({ event: eventId })
            .populate('user', 'name email rollNo yearSection')
            .populate('event', 'title date location')
            .sort({ checkInTime: -1 });
        
        res.json(checkIns);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get check-in history for a user
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        // Users can only see their own check-ins
        if (req.user.id !== userId && req.user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        
        const checkIns = await CheckIn.find({ user: userId })
            .populate('event', 'title date location')
            .sort({ checkInTime: -1 });
        
        res.json(checkIns);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;

