const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Handle multipart/form-data for file uploads (multer handles this, but we need to ensure it's not parsed as JSON)
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.log('Could not connect to local MongoDB. Starting in-memory database...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`MongoDB Connected to In-Memory DB`);
    }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/clubs', require('./routes/clubRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/checkins', require('./routes/checkInRoutes'));
app.use('/api/rsvps', require('./routes/rsvpRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.get('/', (req, res) => {
    res.send('CampusConnect API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
