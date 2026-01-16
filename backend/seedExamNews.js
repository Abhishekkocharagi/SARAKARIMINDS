const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ExamNews = require('./src/models/ExamNews');
const User = require('./src/models/User');

dotenv.config();

const seedExamNews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found.');
            process.exit(1);
        }

        const newsItems = [
            {
                title: 'KPSC KAS 2026 Prelims Date Announced',
                description: 'The KPSC has officially announced the prelims date for KAS 2026. The exam will be held on August 24, 2026 across all district centers.',
                hashtags: ['#KPSCKAS', '#KPSC'],
                status: 'published',
                createdBy: admin._id
            },
            {
                title: 'FDA 2025 Final Selection List Released',
                description: 'Candidates can now check the final selection list for the First Division Assistant (FDA) 2025 recruitment on the official website.',
                hashtags: ['#FDA', '#KPSC'],
                status: 'published',
                createdBy: admin._id
            },
            {
                title: 'New PSI Recruitment Drive 2026',
                description: 'The Home Department has cleared 400+ vacancies for Police Sub-Inspector (PSI). Official notification expected by next month.',
                hashtags: ['#PSI', '#POLICE'],
                status: 'published',
                createdBy: admin._id
            },
            {
                title: 'Draft: Upcoming SDA Notification',
                description: 'Preliminary details regarding the next SDA notification.',
                hashtags: ['#SDA'],
                status: 'draft',
                createdBy: admin._id
            }
        ];

        for (let n of newsItems) {
            const exists = await ExamNews.findOne({ title: n.title });
            if (!exists) {
                await ExamNews.create(n);
                console.log(`Created news: ${n.title}`);
            }
        }

        // Also update the admin user's hashtags so they can see some news in the sidebar
        admin.examHashtags = ['#KPSCKAS', '#FDA'];
        await admin.save();
        console.log('Updated Admin examHashtags for testing.');

        console.log('Exam News seeding completed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedExamNews();
