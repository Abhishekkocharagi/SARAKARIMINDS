const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars explicitly
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

const seedTopicUser = async () => {
    try {
        console.log('Starting seed process...');
        console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 30000,
        });
        console.log('MongoDB Connected');

        const email = 'arunpalled2201@gmail.com';
        const password = 'Arunp@123';
        const name = 'Topic of the Day';

        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists. Updating password and details...');
            user.password = password;
            user.name = name;
            user.accountType = 'Mentor';
            user.role = 'mentor';
            user.isVerified = true;
            await user.save();
            console.log('User updated successfully.');
        } else {
            console.log('User does not exist. Creating new user...');
            await User.create({
                name,
                email,
                password,
                accountType: 'Mentor',
                role: 'mentor',
                isVerified: true,
                about: 'Official Topic of the Day account managed by Arun Palled.'
            });
            console.log('User created successfully.');
        }

        console.log('Seed process completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedTopicUser();
