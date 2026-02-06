const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ad = require('./src/models/Ad');
const ExamNews = require('./src/models/ExamNews');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seed = async () => {
    await connectDB();

    try {
        const user = await User.findOne();
        if (!user) throw new Error('No users found');

        // Clean up existing test data to avoid confusion
        // await Ad.deleteMany({ title: 'Test Ad' });
        // await ExamNews.deleteMany({ title: /News for/ });

        // Create Active Feed Ad
        const feedAd = await Ad.create({
            title: 'Premium Mock Tests',
            description: 'Get 50% off on KAS Prelims Mock Test Series. Limited time offer!',
            imageUrl: 'https://via.placeholder.com/600x300?text=Mock+Tests',
            redirectUrl: 'https://example.com',
            slot: 'FEED_INLINE',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            priority: 10,
            createdBy: user._id
        });
        console.log('Feed Ad Created:', feedAd._id);

        // Create Active Sidebar Ad
        const sidebarAd = await Ad.create({
            title: 'Best Books for PDA',
            description: 'Top rated books for Panchayat Development Officer exam.',
            imageUrl: 'https://via.placeholder.com/300x250?text=Books',
            redirectUrl: 'https://example.com',
            slot: 'SIDEBAR_EXAM',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            priority: 10,
            createdBy: user._id
        });
        console.log('Sidebar Ad Created:', sidebarAd._id);

        // Create Exam News
        const exams = await Exam.find().limit(5);
        for (const exam of exams) {
            await ExamNews.create({
                title: `Admit Card Released for ${exam.name}`,
                description: `The admit cards for ${exam.name} have been released. Download now from the official website.`,
                hashtags: [exam.name],
                status: 'published',
                createdBy: user._id
            });
            console.log(`News Created for ${exam.name}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

seed();
