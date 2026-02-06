const mongoose = require('mongoose');
const { WordPathWord } = require('./src/models/WordPath');
require('dotenv').config();

const words = [
    { word: 'CONSTITUTION', category: 'Polity', difficulty: 'Medium', explanation: 'ಸಂವಿಧಾನ - ದೇಶದ ಸರ್ವೋಚ್ಚ ಕಾನೂನು.' },
    { word: 'PARLIAMENT', category: 'Polity', difficulty: 'Medium', explanation: 'ಸಂಸತ್ತು - ಶಾಸಕಾಂಗದ ಪ್ರಮುಖ ಅಂಗ.' },
    { word: 'DEMOCRACY', category: 'Polity', difficulty: 'Easy', explanation: 'ಪ್ರಜಾಪ್ರಭುತ್ವ - ಪ್ರಜೆಗಳಿಂದ, ಪ್ರಜೆಗಳಿಗಾಗಿ ಆಡಳಿತ.' },
    { word: 'PREAMBLE', category: 'Polity', difficulty: 'Medium', explanation: 'ಪೀಠಿಕೆ - ಸಂವಿಧಾನದ ಪರಿಚಯಾತ್ಮಕ ಭಾಗ.' },
    { word: 'JUDICIARY', category: 'Polity', difficulty: 'Hard', explanation: 'ನ್ಯಾಯಾಂಗ - ಕಾನೂನುಗಳ ವ್ಯಾಖ್ಯಾನಿಸುವ ಅಂಗ.' },
    { word: 'REPUBLIC', category: 'Polity', difficulty: 'Easy', explanation: 'ಗಣರಾಜ್ಯ - ರಾಷ್ಟ್ರದ ಮುಖ್ಯಸ್ಥರು ಚುನಾಯಿತರಾಗುವ ವ್ಯವಸ್ಥೆ.' },
    { word: 'FEDERAL', category: 'Polity', difficulty: 'Hard', explanation: 'ಒಕ್ಕೂಟ - ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯಗಳ ನಡುವೆ ಅಧಿಕಾರ ವಿಭಜನೆ.' },
    { word: 'AMENDMENT', category: 'Polity', difficulty: 'Medium', explanation: 'ತಿದ್ದುಪಡಿ - ಸಂವಿಧಾನದ ನಿಯಮಗಳಲ್ಲಿ ಬದಲಾವಣೆ.' },
    { word: 'SYNONIM', category: 'English', difficulty: 'Easy', explanation: 'ಸಮಾನಾರ್ಥಕ ಪದಗಳು.' },
    { word: 'ANTONYM', category: 'English', difficulty: 'Easy', explanation: 'ವಿರುದ್ಧಾರ್ಥಕ ಪದಗಳು.' },
    { word: 'GRAMMAR', category: 'English', difficulty: 'Medium', explanation: 'ವ್ಯಾಕರಣ - ಭಾಷೆಯ ನಿಯಮಗಳು.' },
    { word: 'VOCABULARY', category: 'English', difficulty: 'Hard', explanation: 'ಪದ ಸಂಪತ್ತು.' },
    { word: 'PUNCTUATION', category: 'English', difficulty: 'Hard', explanation: 'ವಿರಾಮ ಚಿಹ್ನೆಗಳು.' },
    { word: 'ADJECTIVE', category: 'English', difficulty: 'Medium', explanation: 'ಗುಣವಾಚಕ - ನಾಮಪದದ ಗುಣ ತಿಳಿಸುವ ಪದ.' },
    { word: 'PRONOUN', category: 'English', difficulty: 'Easy', explanation: 'ಸರ್ವನಾಮ - ನಾಮಪದದ ಬದಲಿಗೆ ಬಳಸುವ ಪದ.' }
];

const seedWords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await WordPathWord.deleteMany({});
        await WordPathWord.insertMany(words);

        console.log('Words seeded successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedWords();
