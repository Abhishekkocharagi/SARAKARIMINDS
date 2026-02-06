const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Exam = require('../src/models/Exam');

const checkExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const exams = await Exam.find({});
        console.log(`Total Exams In DB: ${exams.length}`);
        console.log('Current Exams In DB:');
        exams.forEach(e => console.log(`- ${e.name} (${e.category})`));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkExams();
