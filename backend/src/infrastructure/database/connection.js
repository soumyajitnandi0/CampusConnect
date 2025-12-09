const mongoose = require('mongoose');
const config = require('../../config');
const logger = require('../../utils/logger');

const connectDB = async () => {
  try {
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+
    // They are now the default behavior
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB Connected', { uri: config.mongoUri.replace(/\/\/.*@/, '//***@') });
  } catch (err) {
    logger.error('MongoDB connection error', err);
    
    // In development, fallback to in-memory database
    if (config.nodeEnv === 'development') {
      logger.warn('Falling back to in-memory database');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        logger.info('MongoDB Connected to In-Memory DB');
      } catch (memoryErr) {
        logger.error('Failed to connect to in-memory database', memoryErr);
        throw memoryErr;
      }
    } else {
      throw err;
    }
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;


