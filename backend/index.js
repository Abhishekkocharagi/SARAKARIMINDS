const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const app = express();

        // Middleware
        app.use(cors());
        app.use(express.json());

        // Routes
        app.use('/api/users', require('./src/routes/userRoutes'));
        app.use('/api/auth', require('./src/routes/authRoutes'));
        app.use('/api/admin', require('./src/routes/adminRoutes'));
        app.use('/api/connections', require('./src/routes/connectionRoutes'));
        app.use('/api/posts', require('./src/routes/postRoutes'));
        app.use('/api/notifications', require('./src/routes/notificationRoutes'));
        app.use('/api/stories', require('./src/routes/storyRoutes'));
        app.use('/api/password-reset', require('./src/routes/passwordResetRoutes'));
        app.use('/api/messages', require('./src/routes/messageRoutes'));
        app.use('/api/ads', require('./src/routes/adRoutes'));
        app.use('/api/admin/ads', require('./src/routes/adRoutes'));
        app.use('/api/exam-news', require('./src/routes/examNewsRoutes'));
        app.use('/api/admin/exam-news', require('./src/routes/examNewsRoutes'));
        app.use('/api/daily-newspapers', require('./src/routes/dailyNewspaperRoutes'));

        app.get('/', (req, res) => {
            res.send('SarkariMinds API is running...');
        });

        // 404 handler
        app.use((req, res, next) => {
            const error = new Error(`Not Found - ${req.originalUrl}`);
            res.status(404);
            next(error);
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
            res.status(statusCode);
            res.json({
                message: err.message,
                stack: process.env.NODE_ENV === 'production' ? null : err.stack,
            });
        });

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
