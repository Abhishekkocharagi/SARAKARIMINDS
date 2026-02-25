const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const Exam = require('./src/models/Exam');
const ExamJobUpdate = require('./src/models/ExamJobUpdate');
const ExamDocument = require('./src/models/ExamDocument');

const clearExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log('MongoDB Connected');

        await Exam.deleteMany({});
        console.log('All Exams deleted');

        await ExamJobUpdate.deleteMany({});
        console.log('All Exam Job Updates deleted');

        await ExamDocument.deleteMany({});
        console.log('All Exam Documents deleted');

        process.exit(0);
    } catch (error) {
        console.error('Error clearing exams:', error);
        process.exit(1);
    }
};

clearExams();
