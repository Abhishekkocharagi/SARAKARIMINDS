const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        const users = [
            {
                name: 'System Admin',
                email: 'admin@nammasarkaari.com',
                password: 'Admin@123', // Model takes care of hashing on .save() or .create()
                role: 'admin',
                accountType: 'Aspirant'
            },
            {
                name: 'Expert Mentor',
                email: 'mentor@nammasarkaari.com',
                password: 'Admin@123',
                role: 'mentor',
                accountType: 'Mentor',
                experience: '10 years',
                expertise: ['KAS', 'PSI']
            },
            {
                name: 'Top Academy',
                email: 'academy@nammasarkaari.com',
                password: 'Admin@123',
                role: 'academy',
                accountType: 'Academy',
                academyDetails: {
                    academyName: 'Namma Academy',
                    location: 'Bangalore',
                    website: 'https://nammaacademy.com',
                    description: 'Top government exam preparation center.'
                }
            }
        ];

        for (let u of users) {
            const userExists = await User.findOne({ email: u.email });
            if (userExists) {
                console.log(`User ${u.email} already exists, skipping...`);
                continue;
            }
            await User.create(u);
            console.log(`Created ${u.role}: ${u.email}`);
        }

        console.log('Seeding completed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedUsers();
