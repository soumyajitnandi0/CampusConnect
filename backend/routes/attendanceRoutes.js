const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.post('/verify', auth, attendanceController.verifyQR);
router.get('/status/:eventId/:userId', auth, attendanceController.getCheckInStatus);
router.get('/stats/:eventId', auth, attendanceController.getAttendanceStats);
router.get('/user', auth, attendanceController.getUserAttendance);

module.exports = router;
