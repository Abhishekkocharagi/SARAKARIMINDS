const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Exam = require('../src/models/Exam');

const checkDups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const dups = await Exam.aggregate([
            { $group: { _id: "$fullName", count: { $sum: 1 }, names: { $push: "$name" } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        console.log('DUPLICATES:', JSON.stringify(dups, null, 2));

        const total = await Exam.countDocuments();
        console.log('TOTAL:', total);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDups();
