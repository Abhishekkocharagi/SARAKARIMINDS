const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./src/models/User');

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        const email = 'arunpalled2201@gmail.com';
        const password = 'Arunp@123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found in DB');
            process.exit(1);
        }

        const isMatch = await user.matchPassword(password);
        console.log('Login test for arunpalled2201@gmail.com:');
        console.log('User found:', !!user);
        console.log('Password match:', isMatch);
        console.log('User role:', user.role);
        console.log('User accountType:', user.accountType);

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testLogin();
