const mongoose = require('mongoose');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Post = require('../models/Post');

/**
 * Cleanup Script: Delete accounts that have passed their scheduled deletion date
 * This should be run daily via a cron job
 */

const cleanupExpiredAccounts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users with scheduled deletion date that has passed
        const now = new Date();
        const usersToDelete = await User.find({
            scheduledDeletionDate: { $lte: now }
        });

        console.log(`Found ${usersToDelete.length} accounts scheduled for deletion`);

        for (const user of usersToDelete) {
            const userId = user._id;
            console.log(`Deleting account: ${user.email} (ID: ${userId})`);

            try {
                // 1. Remove from all connections' lists
                await User.updateMany(
                    { connections: userId },
                    { $pull: { connections: userId } }
                );

                // 2. Remove from all followers' lists
                await User.updateMany(
                    { following: userId },
                    { $pull: { following: userId } }
                );

                // 3. Remove from all following' lists
                await User.updateMany(
                    { followers: userId },
                    { $pull: { followers: userId } }
                );

                // 4. Delete all connection documents involving this user
                await Connection.deleteMany({
                    $or: [{ requester: userId }, { recipient: userId }]
                });

                // 5. Delete all posts by this user
                await Post.deleteMany({ user: userId });

                // 6. Delete the user
                await User.findByIdAndDelete(userId);

                console.log(`Successfully deleted account: ${user.email}`);
            } catch (err) {
                console.error(`Error deleting account ${user.email}:`, err);
            }
        }

        console.log('Cleanup completed');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Cleanup script error:', error);
        process.exit(1);
    }
};

// Run the cleanup
cleanupExpiredAccounts();
