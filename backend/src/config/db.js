const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Increase buffer timeout from default 10s to 30s
        mongoose.set('bufferTimeoutMS', 30000);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Force IPv4 if IPv6 is causing resolution issues
            family: 4,
            // Allow more time for initial connection
            serverSelectionTimeoutMS: 30000,
            // Increase socket timeout
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Re-throw the error so the caller (startServer) knows it failed
        throw error;
    }
};

module.exports = connectDB;
