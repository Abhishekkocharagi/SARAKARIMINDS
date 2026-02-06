const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Exam = require('../src/models/Exam');

const examsToSeed = [
    // KPSC – Gazetted
    { name: 'KAS', fullName: 'Karnataka Administrative Service', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'DSP', fullName: 'Deputy Superintendent of Police (Gazetted)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'AC_REV', fullName: 'Assistant Commissioner (Revenue)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'CTO_A', fullName: 'Commercial Tax Officer (Group A)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'TAH_G1', fullName: 'Tahsildar (Grade 1)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },

    // KPSC – Group B
    { name: 'AD_AGRI', fullName: 'Assistant Director (Agriculture)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'AD_AH', fullName: 'Assistant Director (Animal Husbandry)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'AD_SW', fullName: 'Assistant Director (Social Welfare)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'TAH_G2', fullName: 'Tahsildar (Grade 2)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'AC_CT', fullName: 'Assistant Commissioner (Commercial Tax)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'SO_SEC', fullName: 'Section Officer (Secretariat)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'ACF', fullName: 'Asst. Conservator of Forests', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'VO', fullName: 'Veterinary Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'CDPO', fullName: 'Child Development Project Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'AE_PWD', fullName: 'Assistant Engineer (PWD/RDPR)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },

    // KPSC – Group C (Non-Technical)
    { name: 'FDA', fullName: 'First Division Assistant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'SDA', fullName: 'Second Division Assistant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'EX_INS', fullName: 'Excise Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'EX_GRD', fullName: 'Excise Guard', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'COOP_INS', fullName: 'Cooperative Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'LAB_INS', fullName: 'Labour Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'REV_INS', fullName: 'Revenue Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'VA_KPSC', fullName: 'Village Accountant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'SUB_REG', fullName: 'Sub-Registrar', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'MUN_COM_G2', fullName: 'Municipal Commissioner (Grade 2)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },

    // KPSC – Group C (Technical)
    { name: 'JE_CIVIL', fullName: 'Junior Engineer (Civil)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'JE_ELEC', fullName: 'Junior Engineer (Electrical)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'MVI', fullName: 'Motor Vehicle Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'DRG_INS', fullName: 'Drugs Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'FSO', fullName: 'Food Safety Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'STAT_INS', fullName: 'Statistical Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'LIB_DIST', fullName: 'Librarian (District)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'MED_OFF', fullName: 'Medical Officer (General)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Medical' },
    { name: 'SUR_SUP', fullName: 'Survey Supervisor', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'ASO_STAT', fullName: 'Asst. Statistical Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },

    // Police
    { name: 'PSI', fullName: 'Police Sub-Inspector (Civil)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PSI_CAR', fullName: 'PSI (CAR/DAR)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PC_CIVIL', fullName: 'Police Constable (Civil)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PC_KSRP', fullName: 'Police Constable (KSRP/IRB)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'WLS_INS', fullName: 'Wireless Inspector', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Technical' },

    // Panchayat / RDPR
    { name: 'PDO', fullName: 'Panchayat Development Officer', conductingBody: 'KEA/KPSC', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'GPS_G1', fullName: 'Panchayat Secretary Grade 1', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'GPS_G2', fullName: 'Panchayat Secretary Grade 2', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'PESA_PDO', fullName: 'PESA Panchayat Development Officer', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'RDPR_ACC', fullName: 'RDPR Accountant', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },

    // Teaching / Education
    { name: 'GPSTR', fullName: 'Graduate Primary School Teacher', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'HSTR', fullName: 'High School Teacher Recruitment', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'PUE_LEC', fullName: 'PU College Lecturer', conductingBody: 'PUE', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'ASST_PROF', fullName: 'Assistant Professor (Government First Grade College)', conductingBody: 'KEA', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'BEO', fullName: 'Block Education Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'PET', fullName: 'Physical Education Teacher', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'SP_TEACH', fullName: 'Special Education Teacher', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'KSET', fullName: 'Karnataka State Eligibility Test', conductingBody: 'KSET Center', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Eligibility' },
    { name: 'KTET', fullName: 'Karnataka Teacher Eligibility Test', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Eligibility' },
    { name: 'GUST_FAC', fullName: 'Guest Faculty recruitment', conductingBody: 'University', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Interview' },

    // Health & Medical
    { name: 'STF_NRSE', fullName: 'Staff Nurse (DME/DHS)', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PHARM', fullName: 'Pharmacist', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'LAB_TECH', fullName: 'Lab Technician', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'HLT_INS', fullName: 'Health Inspector', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'ANM', fullName: 'Junior Health Assistant (ANM)', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'DENTIST', fullName: 'Dentist (DHS)', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Medical' },
    { name: 'RADIOG', fullName: 'Radiographer', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'OPTH_ASST', fullName: 'Ophthalmic Assistant', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PHYSIO', fullName: 'Physiotherapist', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'DIET', fullName: 'Dietician', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },

    // PSU / Boards
    { name: 'KPTCL_AE', fullName: 'KPTCL Assistant Engineer', conductingBody: 'KPTCL', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KPTCL_JE', fullName: 'KPTCL Junior Engineer', conductingBody: 'KPTCL', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'BESCOM_ALM', fullName: 'BESCOM Asst. Lineman', conductingBody: 'BESCOM', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KSRTC_DC', fullName: 'KSRTC Driver/Conductor', conductingBody: 'KSRTC', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Skill Test' },
    { name: 'BWSSB_AE', fullName: 'BWSSB Assistant Engineer', conductingBody: 'BWSSB', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KMF_TO', fullName: 'KMF Technical Officer', conductingBody: 'KMF', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KHL_AM', fullName: 'KHL Asst. Manager', conductingBody: 'KHL', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'KEONICS_WD', fullName: 'KEONICS Web Developer', conductingBody: 'KEONICS', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KHB_SE', fullName: 'KHB Site Engineer', conductingBody: 'KHB', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'HESCOM_JA', fullName: 'HESCOM Junior Assistant', conductingBody: 'HESCOM', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Clerical' },

    // Judiciary
    { name: 'DIST_JUDGE', fullName: 'District Judge (Entry Level)', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },
    { name: 'CIV_JUDGE', fullName: 'Civil Judge (Junior Division)', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },
    { name: 'HC_STENO', fullName: 'High Court Stenographer', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Skill Test' },
    { name: 'DC_CLRK', fullName: 'District Court Clerk', conductingBody: 'Judiciary', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'PUB_PROS', fullName: 'Public Prosecutor', conductingBody: 'Judiciary', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },

    // Central Government
    { name: 'UPSC_CSE', fullName: 'UPSC Civil Services Examination', conductingBody: 'UPSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_CGL', fullName: 'SSC Combined Graduate Level', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_CHSL', fullName: 'SSC Combined Higher Secondary Level', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'RRB_NTPC', fullName: 'RRB Non-Technical Popular Categories', conductingBody: 'RRB', examLevel: 'Central', category: 'Central Government', language: 'Multi-lingual', examType: 'Competitive' },
    { name: 'RRB_GRPD', fullName: 'RRB Group D', conductingBody: 'RRB', examLevel: 'Central', category: 'Central Government', language: 'Multi-lingual', examType: 'Competitive' },
    { name: 'IBPS_PO', fullName: 'IBPS Probationary Officer', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'IBPS_CLRK', fullName: 'IBPS Clerk', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'SBI_PO', fullName: 'SBI Probationary Officer', conductingBody: 'SBI', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'LIC_ADO', fullName: 'LIC Apprentice Development Officer', conductingBody: 'LIC', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'IB_ACIO', fullName: 'Intelligence Bureau ACIO', conductingBody: 'MHA', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
];

const seedExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        for (const examData of examsToSeed) {
            await Exam.findOneAndUpdate(
                { name: examData.name },
                { $set: examData },
                { upsert: true, new: true }
            );
            console.log(`Synced Exam: ${examData.name}`);
        }

        console.log('All exams seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedExams();
