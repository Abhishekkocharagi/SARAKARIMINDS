const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dir = path.join(__dirname, '../../uploads/newspapers', today);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Clean filename and add timestamp to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Image files are allowed for newspapers'), false);
    }
};

const newspaperUpload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB Limit
    },
    fileFilter: fileFilter
});

module.exports = newspaperUpload;
