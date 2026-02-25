const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'sarkariminds/general';
        if (req.originalUrl.includes('exams')) {
            folder = 'sarkariminds/exams';
        } else if (req.originalUrl.includes('posts')) {
            folder = 'sarkariminds/posts';
        } else if (req.originalUrl.includes('messages')) {
            folder = 'sarkariminds/messages';
        }

        const fileExt = file.originalname.split('.').pop().toLowerCase();
        const fileName = file.originalname.split('.').slice(0, -1).join('.') || 'file';
        const safeName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = Date.now();

        // PDF is a special case in Cloudinary.
        // If uploaded as 'image', it allows transformations and gets application/pdf header.
        // If uploaded as 'raw', it's just a binary blob.
        if (file.mimetype === 'application/pdf') {
            return {
                folder: folder,
                resource_type: 'image', // Best for PDFs to be served as application/pdf
                public_id: `${timestamp}-${safeName}`, // NO EXTENSION in public_id for 'image' type
                format: 'pdf', // Explicitly set format to pdf
                flags: 'attachment:false' // Ensure it's not forced as attachment
            };
        }

        if (file.mimetype.startsWith('image/')) {
            return {
                folder: folder,
                resource_type: 'image',
                public_id: `${timestamp}-${safeName}`,
                format: fileExt
            };
        }

        if (file.mimetype.startsWith('video/')) {
            return {
                folder: folder,
                resource_type: 'video',
                public_id: `${timestamp}-${safeName}`,
                format: fileExt
            };
        }

        // For everything else (docs, sheets, etc)
        return {
            folder: folder,
            resource_type: 'raw',
            public_id: `${timestamp}-${safeName}.${fileExt}` // MUST include extension for 'raw'
        };
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'video/mp4', 'video/webm', 'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type (${file.mimetype}). Please upload an Image, PDF, Doc, or Sheet.`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB Limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
