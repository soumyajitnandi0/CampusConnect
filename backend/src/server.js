const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./infrastructure/database/connection');

// Import routes
const authRoutes = require('./presentation/routes/authRoutes');

const app = express();

// Trust proxy (for production behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Legacy routes (for backward compatibility during migration)
app.use('/api/events', require('../routes/eventRoutes'));
app.use('/api/clubs', require('../routes/clubRoutes'));
app.use('/api/chat', require('../routes/chatRoutes'));
app.use('/api/attendance', require('../routes/attendanceRoutes'));
app.use('/api/checkins', require('../routes/checkInRoutes'));
app.use('/api/rsvps', require('../routes/rsvpRoutes'));
app.use('/api/feedback', require('../routes/feedbackRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/notifications', require('../routes/notificationRoutes'));
app.use('/api/upload', require('../routes/uploadRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CampusConnect API is running',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;


