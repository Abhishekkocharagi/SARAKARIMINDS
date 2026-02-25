const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Exam = require('../models/Exam');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const exams = [
    {
        name: 'KAS',
        fullName: 'Karnataka Administrative Services',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Civil Services',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'PSI',
        fullName: 'Police Sub Inspector',
        conductingBody: 'State Police',
        examLevel: 'State',
        category: 'Police Services',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'PC',
        fullName: 'Police Constable',
        conductingBody: 'State Police',
        examLevel: 'State',
        category: 'Police Services',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'FDA',
        fullName: 'First Division Assistant',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Non-Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'SDA',
        fullName: 'Second Division Assistant',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Non-Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'PDO',
        fullName: 'Panchayat Development Officer',
        conductingBody: 'RDPR',
        examLevel: 'State',
        category: 'Rural Development',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'VA',
        fullName: 'Village Administrative Officer',
        conductingBody: 'Revenue Department',
        examLevel: 'State',
        category: 'Revenue',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'TET',
        fullName: 'Teacher Eligibility Test',
        conductingBody: 'Department of School Education',
        examLevel: 'State',
        category: 'Teaching',
        status: 'active',
        language: 'ka',
        examType: 'Qualification'
    },
    {
        name: 'Group C',
        fullName: 'KPSC Group C Non-Technical',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Non-Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'RFO',
        fullName: 'Range Forest Officer',
        conductingBody: 'Forest Department',
        examLevel: 'State',
        category: 'Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'Forest Guard',
        fullName: 'Forest Guard / Deputy Range Forest Officer',
        conductingBody: 'Forest Department',
        examLevel: 'State',
        category: 'Non-Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'MVI',
        fullName: 'Motor Vehicle Inspector',
        conductingBody: 'KPSC / Transport Dept',
        examLevel: 'State',
        category: 'Technical',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    },
    {
        name: 'CTO',
        fullName: 'Commercial Tax Officer',
        conductingBody: 'KPSC',
        examLevel: 'State',
        category: 'Gazetted',
        status: 'active',
        language: 'ka',
        examType: 'Competitive'
    }
];

const seedExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mmm');
        console.log('Connected to MongoDB');

        for (const examData of exams) {
            await Exam.findOneAndUpdate(
                { name: examData.name },
                examData,
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${examData.name}`);
        }

        console.log('Seed completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding exams:', error);
        process.exit(1);
    }
};

seedExams();
