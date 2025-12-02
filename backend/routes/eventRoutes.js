const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.get('/organizer/:organizerId', eventController.getEventsByOrganizer);

// Protected routes
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.post('/:id/rsvp', auth, eventController.rsvpEvent);
router.delete('/:id/rsvp', auth, eventController.cancelRSVP);

module.exports = router;
