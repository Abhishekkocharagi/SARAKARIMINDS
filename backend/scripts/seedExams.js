const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('../src/models/Exam');
const connectDB = require('../src/config/db');

dotenv.config();

const exams = [
    {
        name: 'KAS',
        fullName: 'Karnataka Administrative Service - Gazetted Probationers',
        conductingBody: 'KPSC (Karnataka Public Service Commission)',
        examLevel: 'State',
        category: 'Administrative',
        language: 'Kannada / English',
        examType: 'Competitive',
        status: 'active'
    },
    {
        name: 'FDA',
        fullName: 'First Division Assistant',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Clerical/Officer',
        language: 'Kannada / English',
        examType: 'Competitive',
        status: 'active'
    },
    {
        name: 'SDA',
        fullName: 'Second Division Assistant',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Clerical',
        language: 'Kannada / English',
        examType: 'Competitive',
        status: 'active'
    },
    {
        name: 'PSI',
        fullName: 'Police Sub-Inspector',
        conductingBody: 'KSP (Karnataka State Police)',
        examLevel: 'State',
        category: 'Police',
        language: 'Kannada / English',
        examType: 'Competitive',
        status: 'active'
    },
    {
        name: 'PDO',
        fullName: 'Panchayat Development Officer',
        conductingBody: 'RDPR (Rural Development and Panchayat Raj Department)',
        examLevel: 'State',
        category: 'Rural Development',
        language: 'Kannada / English',
        examType: 'Competitive',
        status: 'active'
    }
];

const seedExams = async () => {
    try {
        await connectDB();

        // Check if exams already exist
        const count = await Exam.countDocuments();
        if (count > 0) {
            console.log('Exams already exist. Skipping seed.');
            process.exit();
        }

        await Exam.insertMany(exams);
        console.log('5 Mandatory Exams Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedExams();
