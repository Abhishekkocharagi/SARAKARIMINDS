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

        // Serve Static Files with PDF headers
        const path = require('path');
        app.use('/uploads', (req, res, next) => {
            if (req.path.endsWith('.pdf')) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline');
            }
            next();
        }, express.static(path.join(__dirname, 'uploads')));

        // Handle favicon.ico to prevent 404/500 errors
        app.get('/favicon.ico', (req, res) => res.status(204).end());

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
        app.use('/api/mentor', require('./src/routes/mentorRoutes')); // NEW
        app.use('/api/groups', require('./src/routes/groupRoutes')); // NEW
        app.use('/api/academy', require('./src/routes/academyRoutes')); // NEW
        app.use('/api/campaigns', require('./src/routes/campaignRoutes')); // NEW
        app.use('/api/admin/job-updates', require('./src/routes/jobUpdateRoutes')); // NEW
        app.use('/api/jobs', require('./src/routes/publicJobRoutes')); // NEW Public Job Routes
        app.use('/api/exams', require('./src/routes/examRoutes')); // EXAM ECOSYSTEM
        app.use('/api/admin/exams', require('./src/routes/adminExamRoutes')); // EXAM ECOSYSTEM ADMIN
        app.use('/api/analytics', require('./src/routes/analyticsRoutes')); // ANALYTICS
        app.use('/api/quiz', require('./src/routes/quizRoutes')); // QUIZ
        app.use('/api/jilebi', require('./src/routes/jilebiRoutes')); // JILEBI USER
        app.use('/api/admin/jilebi', require('./src/routes/jilebiRoutes')); // JILEBI ADMIN (mounted at root)
        app.use('/api/word-path', require('./src/routes/wordPathRoutes')); // WORD PATH CHALLENGE
        app.use('/api/current-affairs', require('./src/routes/currentAffairRoutes')); // CURRENT AFFAIRS

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
