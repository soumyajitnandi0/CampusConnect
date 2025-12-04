const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'doihs4i87',
  api_key: process.env.CLOUDINARY_API_KEY || '858276792164733',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Lqi4dM5OIWtHS0vPwn32OX74M_w',
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload image to Cloudinary
exports.uploadImage = (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file ? 'Present' : 'Missing');
    console.log('File details:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ msg: 'No image file provided' });
    }

    if (!req.file.buffer) {
      console.error('File buffer is missing');
      return res.status(400).json({ msg: 'File buffer is missing' });
    }

    console.log('Uploading to Cloudinary...');
    
    // Determine folder based on query parameter or default to events
    const folderType = req.query.type || 'events'; // 'events' or 'clubs'
    const folder = `campus-connect/${folderType}`;
    
    // Convert buffer to stream
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder, // Organize in folder (events or clubs)
        resource_type: 'image',
        // Don't apply transformations here - we'll do it on the frontend for flexibility
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ msg: 'Failed to upload image', error: error.message });
        }

        console.log('Upload successful:', result.public_id);
        // Return the public_id (we'll use this to generate URLs with transformations)
        res.json({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }
    );

    // Pipe the buffer to the stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// Export multer middleware
exports.uploadMiddleware = upload.single('image');

