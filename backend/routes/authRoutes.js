const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Email/Password authentication
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Supabase OAuth sync (with role selection)
router.post('/sync', auth, authController.syncUser);

module.exports = router;
