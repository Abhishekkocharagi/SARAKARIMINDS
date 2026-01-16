const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ad = require('./src/models/Ad');
const User = require('./src/models/User');

dotenv.config();

const seedAds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found to associate ads with.');
            process.exit(1);
        }

        const ads = [
            {
                title: 'Namma Academy',
                description: 'Join the #1 KPSC coaching center in Bangalore. New batches starting next Monday! Get 20% off on early registration.',
                imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop',
                redirectUrl: 'https://example.com/namma-academy',
                slot: 'FEED_INLINE',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                priority: 10,
                createdBy: admin._id
            },
            {
                title: 'ExamMaster Pro',
                description: 'The ultimate mock test series for PSI and KAS aspirants.',
                imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop',
                redirectUrl: 'https://example.com/exammaster',
                slot: 'SIDEBAR_EXAM',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                priority: 5,
                createdBy: admin._id
            }
        ];

        for (let a of ads) {
            const exists = await Ad.findOne({ title: a.title });
            if (!exists) {
                await Ad.create(a);
                console.log(`Created ad: ${a.title}`);
            }
        }

        console.log('Ads seeding completed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAds();
