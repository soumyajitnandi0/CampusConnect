const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File too large. Maximum size is 10MB.' });
    }
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ msg: 'Only image files are allowed' });
    }
    console.error('Multer error:', err);
    return res.status(400).json({ msg: err.message || 'File upload error' });
  }
  next();
};

// Upload image endpoint (protected - requires authentication)
router.post('/image', auth, uploadController.uploadMiddleware, handleMulterError, uploadController.uploadImage);

module.exports = router;

