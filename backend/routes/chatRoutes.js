const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Protected routes
router.post('/club/:clubId', auth, chatController.sendMessage);
router.get('/club/:clubId', auth, chatController.getMessages);
router.delete('/:messageId', auth, chatController.deleteMessage);

module.exports = router;


