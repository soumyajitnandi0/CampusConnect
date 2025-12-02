const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET api/dashboard/organizer
// @desc    Get aggregated stats for organizer
// @access  Private (Organizer)
router.get('/organizer', auth, dashboardController.getOrganizerStats);

// @route   GET api/dashboard/event/:eventId
// @desc    Get specific event stats and feedback
// @access  Private (Organizer)
router.get('/event/:eventId', auth, dashboardController.getEventStats);

module.exports = router;
