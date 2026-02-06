const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'arunpalled4@gmail.com';
        const password = 'Arun@123'; // Plain text, let the model hash it

        let user = await User.findOne({ email });

        if (user) {
            console.log('User found. Updating role and password...');
            user.role = 'admin';
            user.accountType = 'Admin';
            user.password = password; // Pass plain text, pre-save hook will hash it
            user.isVerified = true;
            await user.save();
            console.log('User updated to Admin successfully.');
        } else {
            console.log('User not found. Creating new Admin user...');
            // For create, we also pass plain text + required fields
            user = await User.create({
                name: 'Admin User',
                email: email,
                password: password, // Pass plain text
                role: 'admin',
                accountType: 'Admin',
                isVerified: true,
                mobile: '0000000000'
            });
            console.log('Admin user created successfully.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
