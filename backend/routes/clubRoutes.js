const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', clubController.getClubs);

// Protected routes - must come before /:id to avoid route conflicts
router.post('/', auth, clubController.createClub);
router.get('/organizer/my-clubs', auth, clubController.getClubsByOrganizer);
router.get('/user/followed', auth, clubController.getFollowedClubs);

// Public routes with ID - must come after specific routes
router.get('/:id', clubController.getClubById);
router.get('/:id/events', clubController.getClubEvents);

// Protected routes with ID
router.put('/:id', auth, clubController.updateClub);
router.delete('/:id', auth, clubController.deleteClub);
router.post('/:id/follow', auth, clubController.followClub);
router.delete('/:id/follow', auth, clubController.unfollowClub);

module.exports = router;

