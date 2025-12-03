const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', eventController.getEvents);
router.get('/organizer/:organizerId', eventController.getEventsByOrganizer);

// Protected routes - must come before /:id to avoid route conflicts
router.get('/my-events', auth, eventController.getMyEvents);

// Public route - must come after /my-events
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.post('/:id/rsvp', auth, eventController.rsvpEvent);
router.delete('/:id/rsvp', auth, eventController.cancelRSVP);

module.exports = router;
