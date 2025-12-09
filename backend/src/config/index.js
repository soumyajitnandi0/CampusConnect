require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/campus-connect',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-key-change-in-production' : undefined),
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  
  // Supabase
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  },
};

// Validate required configuration (only in production)
if (config.nodeEnv === 'production') {
  const requiredConfig = ['jwtSecret', 'mongoUri'];
  const missingConfig = requiredConfig.filter(key => !config[key]);
  
  if (missingConfig.length > 0) {
    console.error('Missing required environment variables:', missingConfig.join(', '));
    process.exit(1);
  }
} else {
  // In development, warn about missing config but don't exit
  if (!config.jwtSecret || config.jwtSecret === 'dev-secret-key-change-in-production') {
    console.warn('⚠️  Using default JWT secret for development. Set JWT_SECRET in production!');
  }
}

module.exports = config;


