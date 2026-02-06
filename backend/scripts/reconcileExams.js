const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Exam = require('../src/models/Exam');

const masterExams = [
    // ---------------------------------------------
    // KPSC – Gazetted (Group A/B Gazetted)
    // ---------------------------------------------
    { name: 'KAS', fullName: 'Karnataka Administrative Service', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'DSP', fullName: 'Deputy Superintendent of Police', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'AC_REV', fullName: 'Assistant Commissioner (Revenue)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'CTO', fullName: 'Commercial Tax Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'TAHSILDAR', fullName: 'Tahsildar (Grade 1 & 2)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Gazetted', language: 'Kannada/English', examType: 'Competitive' },

    // ---------------------------------------------
    // KPSC – Group B
    // ---------------------------------------------
    { name: 'AD_AGRI', fullName: 'Assistant Director (Agriculture)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'AD_AH', fullName: 'Assistant Director (Animal Husbandry)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'ACF', fullName: 'Asst. Conservator of Forests', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'VO', fullName: 'Veterinary Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'CDPO', fullName: 'Child Development Project Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'AE_PWD', fullName: 'Assistant Engineer (PWD/RDPR)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },
    { name: 'AD_SW', fullName: 'Assistant Director (Social Welfare)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'RFO', fullName: 'Range Forest Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group B', language: 'Kannada/English', examType: 'Technical' },

    // ---------------------------------------------
    // KPSC – Group C (Non-Technical)
    // ---------------------------------------------
    { name: 'FDA', fullName: 'First Division Assistant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'SDA', fullName: 'Second Division Assistant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'EX_INS', fullName: 'Excise Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'EX_GRD', fullName: 'Excise Guard', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'COOP_INS', fullName: 'Cooperative Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'LAB_INS', fullName: 'Labour Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'REV_INS', fullName: 'Revenue Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'VA', fullName: 'Village Accountant', conductingBody: 'KEA/Revenue', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'SUB_REG', fullName: 'Sub-Registrar', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'BILL_COLL', fullName: 'Bill Collector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'JR_ASST', fullName: 'Junior Assistant', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'WARDEN', fullName: 'Hostel Warden', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Non-Technical)', language: 'Kannada/English', examType: 'Competitive' },

    // ---------------------------------------------
    // KPSC – Group C (Technical)
    // ---------------------------------------------
    { name: 'JE_CIVIL', fullName: 'Junior Engineer (Civil)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'JE_ELEC', fullName: 'Junior Engineer (Electrical)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'MVI', fullName: 'Motor Vehicle Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'DRG_INS', fullName: 'Drugs Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'FSO', fullName: 'Food Safety Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'STAT_INS', fullName: 'Statistical Inspector', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'SURVEYOR', fullName: 'Land Surveyor', conductingBody: 'SSLr', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'LIB_DIST', fullName: 'Librarian', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Technical' },
    { name: 'MED_OFF', fullName: 'Medical Officer (General)', conductingBody: 'KPSC', examLevel: 'State', category: 'KPSC – Group C (Technical)', language: 'Kannada/English', examType: 'Medical' },

    // ---------------------------------------------
    // Police
    // ---------------------------------------------
    { name: 'PSI', fullName: 'Police Sub-Inspector (Civil)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PSI_CAR', fullName: 'PSI (CAR/DAR)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PSI_WL', fullName: 'PSI (Wireless)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PSI_KSISF', fullName: 'PSI (KSISF)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PC_CIVIL', fullName: 'Police Constable (Civil)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PC_CAR', fullName: 'Police Constable (CAR/DAR)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'PC_WL', fullName: 'Police Constable (Wireless)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PC_KSISF', fullName: 'Police Constable (KSISF)', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'JAILER', fullName: 'Jailer', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'WARDER', fullName: 'Warder', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },
    { name: 'FIREMAN', fullName: 'Fireman / Fire Station Officer', conductingBody: 'KSP', examLevel: 'State', category: 'Police', language: 'Kannada/English', examType: 'Physical + Written' },

    // ---------------------------------------------
    // Panchayat / RDPR
    // ---------------------------------------------
    { name: 'PDO', fullName: 'Panchayat Development Officer', conductingBody: 'KEA/KPSC', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'GPS', fullName: 'Gram Panchayat Secretary (Grade 1 & 2)', conductingBody: 'KEA', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'RDPR_ACC', fullName: 'RDPR Accountant', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'TAX_COLL', fullName: 'Tax Collector', conductingBody: 'RDPR', examLevel: 'State', category: 'Panchayat / RDPR', language: 'Kannada/English', examType: 'Competitive' },

    // ---------------------------------------------
    // Teaching / Education
    // ---------------------------------------------
    { name: 'GPSTR', fullName: 'Graduate Primary School Teacher (6-8)', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'HSTR', fullName: 'High School Teacher Recruitment', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'PUE_LEC', fullName: 'PU College Lecturer', conductingBody: 'PUE', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'ASST_PROF', fullName: 'Assistant Professor (FG College)', conductingBody: 'KEA', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'BEO', fullName: 'Block Education Officer', conductingBody: 'KPSC', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'PET', fullName: 'Physical Education Teacher', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'SP_TEACH', fullName: 'Special Education Teacher', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Competitive' },
    { name: 'GUST_FAC', fullName: 'Guest Faculty Recruitment', conductingBody: 'University', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Interview' },
    { name: 'KSET', fullName: 'Karnataka State Eligibility Test', conductingBody: 'KSET Center', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Eligibility' },
    { name: 'KTET', fullName: 'Karnataka Teacher Eligibility Test', conductingBody: 'CED', examLevel: 'State', category: 'Teaching / Education', language: 'Kannada/English', examType: 'Eligibility' },

    // ---------------------------------------------
    // Health & Medical
    // ---------------------------------------------
    { name: 'STF_NRSE', fullName: 'Staff Nurse', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PHARM', fullName: 'Pharmacist', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'LAB_TECH', fullName: 'Lab Technician', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'HLT_INS', fullName: 'Health Inspector', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'ANM', fullName: 'Junior Health Assistant (ANM)', conductingBody: 'HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'DENTIST', fullName: 'Dentist', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Medical' },
    { name: 'RADIOG', fullName: 'Radiographer', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },
    { name: 'PHYSIO', fullName: 'Physiotherapist', conductingBody: 'KPSC/HFW', examLevel: 'State', category: 'Health & Medical', language: 'Kannada/English', examType: 'Technical' },

    // ---------------------------------------------
    // PSU / Boards
    // ---------------------------------------------
    { name: 'KPTCL_AE', fullName: 'KPTCL Assistant Engineer', conductingBody: 'KPTCL/KEA', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KPTCL_JE', fullName: 'KPTCL Junior Engineer', conductingBody: 'KPTCL/KEA', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KPTCL_JA', fullName: 'KPTCL Junior Assistant', conductingBody: 'KPTCL/KEA', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'ESCOM_ALM', fullName: 'Lineman (BESCOM/HESCOM/etc)', conductingBody: 'ESCOMs', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Skill Test' },
    { name: 'KSRTC_DC', fullName: 'KSRTC Driver/Conductor', conductingBody: 'KSRTC', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Skill Test' },
    { name: 'KSRTC_TA', fullName: 'KSRTC Technical Assistant', conductingBody: 'KSRTC', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'BWSSB_AE', fullName: 'BWSSB Engineer', conductingBody: 'BWSSB', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KMF_TO', fullName: 'KMF Technical Officer', conductingBody: 'KMF', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KHB_SE', fullName: 'KHB Site Engineer', conductingBody: 'KHB', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Technical' },
    { name: 'KEONICS', fullName: 'KEONICS Recruitment', conductingBody: 'KEONICS', examLevel: 'State', category: 'PSU / Boards', language: 'Kannada/English', examType: 'Competitive' },

    // ---------------------------------------------
    // Judiciary
    // ---------------------------------------------
    { name: 'DIST_JUDGE', fullName: 'District Judge', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },
    { name: 'CIV_JUDGE', fullName: 'Civil Judge', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },
    { name: 'HC_STENO', fullName: 'High Court Stenographer', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Skill Test' },
    { name: 'DC_CLRK', fullName: 'District Court Clerk/Typist', conductingBody: 'District Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Clerical' },
    { name: 'PUB_PROS', fullName: 'Public Prosecutor', conductingBody: 'High Court', examLevel: 'State', category: 'Judiciary', language: 'Kannada/English', examType: 'Law' },

    // ---------------------------------------------
    // Central Government
    // ---------------------------------------------
    { name: 'UPSC_CSE', fullName: 'UPSC Civil Services Examination', conductingBody: 'UPSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_CGL', fullName: 'SSC Combined Graduate Level', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_CHSL', fullName: 'SSC CHSL', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_GD', fullName: 'SSC GD Constable', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_MTS', fullName: 'SSC MTS', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Competitive' },
    { name: 'SSC_JE', fullName: 'SSC Junior Engineer', conductingBody: 'SSC', examLevel: 'Central', category: 'Central Government', language: 'Hindi/English', examType: 'Technical' },
    { name: 'IBPS_PO', fullName: 'IBPS Probationary Officer', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'IBPS_CLRK', fullName: 'IBPS Clerk', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'IBPS_SO', fullName: 'IBPS Specialist Officer', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Technical' },
    { name: 'IBPS_RRB', fullName: 'IBPS RRB Officer/Assistant', conductingBody: 'IBPS', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'SBI_PO', fullName: 'SBI Probationary Officer', conductingBody: 'SBI', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'SBI_CLRK', fullName: 'SBI Clerk', conductingBody: 'SBI', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'RRB_NTPC', fullName: 'RRB NTPC', conductingBody: 'RRB', examLevel: 'Central', category: 'Central Government', language: 'Multi-lingual', examType: 'Competitive' },
    { name: 'RRB_GRPD', fullName: 'RRB Group D', conductingBody: 'RRB', examLevel: 'Central', category: 'Central Government', language: 'Multi-lingual', examType: 'Competitive' },
    { name: 'RRB_ALP', fullName: 'RRB Assistant Loco Pilot', conductingBody: 'RRB', examLevel: 'Central', category: 'Central Government', language: 'Multi-lingual', examType: 'Competitive' },
    { name: 'LIC_AAO', fullName: 'LIC AAO', conductingBody: 'LIC', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'LIC_ADO', fullName: 'LIC Apprentice Development Officer', conductingBody: 'LIC', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' },
    { name: 'IB_ACIO', fullName: 'Intelligence Bureau ACIO', conductingBody: 'MHA', examLevel: 'Central', category: 'Central Government', language: 'English', examType: 'Competitive' }
];

const reconcileExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        let addedCount = 0;
        let skippedCount = 0;

        for (const examData of masterExams) {
            // Check if exam exists by name
            const existingExam = await Exam.findOne({ name: examData.name });

            if (existingExam) {
                console.log(`[SKIPPED] ${examData.name} already exists.`);
                skippedCount++;
            } else {
                await Exam.create(examData);
                console.log(`[ADDED] ${examData.name}`);
                addedCount++;
            }
        }

        console.log('-----------------------------------');
        console.log(`Reconciliation Complete.`);
        console.log(`Total Exams Added: ${addedCount}`);
        console.log(`Total Exams Skipped: ${skippedCount}`);

        const totalExams = await Exam.countDocuments();
        console.log(`Final Total Exam Count in DB: ${totalExams}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

reconcileExams();
