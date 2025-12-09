const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

// Email/Password authentication
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Supabase OAuth sync (with role selection)
router.post('/sync', authenticate, authController.syncUser);

module.exports = router;


