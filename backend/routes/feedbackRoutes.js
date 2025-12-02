const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

// @route   POST api/feedback
// @desc    Submit feedback for an event
// @access  Private (Student)
router.post('/', auth, feedbackController.submitFeedback);

// @route   GET api/feedback/event/:eventId
// @desc    Get all feedback for an event
// @access  Private (Organizer)
router.get('/event/:eventId', auth, feedbackController.getEventFeedback);

module.exports = router;
