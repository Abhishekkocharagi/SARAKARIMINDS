const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Exam = require('../models/Exam');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, accountType, exams, mobile } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Sync with legacy fields
    const preferredExams = req.body.preferredExams || [];
    const selectedExamsData = await Exam.find({ _id: { $in: preferredExams } });
    const examNames = selectedExamsData.map(e => e.name);

    const user = await User.create({
        name,
        email,
        password,
        mobile,
        accountType: 'Aspirant', // Enforce default
        role: 'student',         // Enforce default
        exams: examNames,
        examHashtags: examNames,
        preferredExams
    });

    if (user) {
        // Streak Reset Logic
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        let updated = false;

        if (user.lastDailyQuizAttemptDate) {
            const last = new Date(user.lastDailyQuizAttemptDate);
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyQuizStreakCount > 0) {
                user.dailyQuizStreakCount = 0;
                updated = true;
            }
        }

        if (user.lastDailyGameAttemptDate) {
            const last = new Date(user.lastDailyGameAttemptDate);
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyGameStreakCount > 0) {
                user.dailyGameStreakCount = 0;
                updated = true;
            }
        }

        if (updated) await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            exams: user.exams,
            token: generateToken(user._id),
            profilePic: user.profilePic,
            coverPic: user.coverPic,
            connectionsCount: user.connections.length,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            role: user.role,
            language: user.language,
            preferredExams: user.preferredExams,
            receiveAllNotifications: user.receiveAllNotifications,
            isVerified: user.isVerified,
            savedPosts: user.savedPosts,
            dailyQuizStreakCount: user.dailyQuizStreakCount,
            dailyGameStreakCount: user.dailyGameStreakCount
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('preferredExams', 'name fullName category');

    if (user && (await user.matchPassword(password))) {
        // Streak Reset Logic
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        let updated = false;

        // Reset Quiz Streak
        if (user.lastDailyQuizAttemptDate) {
            const last = new Date(user.lastDailyQuizAttemptDate);
            // If last attempt was before yesterday (UTC comparison safest by day diff)
            const diffTime = Math.abs(now - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check if same day (0) or yesterday (1). If > 1, reset.
            // More precise: check if last date < yesterday start

            // Simple approach: invalid if last attempt date is not today AND not yesterday
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyQuizStreakCount > 0) {
                user.dailyQuizStreakCount = 0;
                updated = true;
            }
        }

        // Reset Game Streak
        if (user.lastDailyGameAttemptDate) {
            const last = new Date(user.lastDailyGameAttemptDate);
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyGameStreakCount > 0) {
                user.dailyGameStreakCount = 0;
                updated = true;
            }
        }

        if (updated) await user.save();

        if (user.isBlocked) {
            res.status(403);
            throw new Error('Your account is blocked. Please contact support.');
        }

        // Check if account is scheduled for deletion and cancel it
        let deletionCancelled = false;
        if (user.scheduledDeletionDate && new Date() < new Date(user.scheduledDeletionDate)) {
            user.deletionRequestedAt = undefined;
            user.scheduledDeletionDate = undefined;
            await user.save();
            deletionCancelled = true;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            exams: user.exams,
            profilePic: user.profilePic,
            coverPic: user.coverPic,
            connectionsCount: user.connections.length,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            token: generateToken(user._id),
            role: user.role,
            examHashtags: user.examHashtags || [],
            language: user.language,
            preferredExams: user.preferredExams,
            receiveAllNotifications: user.receiveAllNotifications,
            isVerified: user.isVerified,
            savedPosts: user.savedPosts,
            dailyQuizStreakCount: user.dailyQuizStreakCount,
            dailyGameStreakCount: user.dailyGameStreakCount,
            deletionCancelled: deletionCancelled
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('preferredExams', 'name fullName category');

    if (user) {
        // Streak Reset Logic
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        let updated = false;

        if (user.lastDailyQuizAttemptDate) {
            const last = new Date(user.lastDailyQuizAttemptDate);
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyQuizStreakCount > 0) {
                user.dailyQuizStreakCount = 0;
                updated = true;
            }
        }

        if (user.lastDailyGameAttemptDate) {
            const last = new Date(user.lastDailyGameAttemptDate);
            const isToday = last.toDateString() === now.toDateString();
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday && user.dailyGameStreakCount > 0) {
                user.dailyGameStreakCount = 0;
                updated = true;
            }
        }

        if (updated) await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            exams: user.exams,
            about: user.about,
            profilePic: user.profilePic,
            coverPic: user.coverPic,
            connections: user.connections,
            followers: user.followers,
            following: user.following,
            examHashtags: user.examHashtags || [],
            language: user.language,
            preferredExams: user.preferredExams,
            receiveAllNotifications: user.receiveAllNotifications,
            isVerified: user.isVerified,
            savedPosts: user.savedPosts
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users for networking
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    // Excluding self
    const users = await User.find({ _id: { $ne: req.user._id } })
        .select('-password')
        .limit(20);
    res.json(users);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        console.log('Updating profile for:', user.email);
        console.log('Request body:', req.body);
        console.log('Files:', req.files);

        user.name = req.body.name || user.name;
        user.about = req.body.about || user.about;
        user.language = req.body.language || user.language;

        if (req.files) {
            if (req.files.profilePic) {
                user.profilePic = req.files.profilePic[0].path;
            }
            if (req.files.coverPic) {
                user.coverPic = req.files.coverPic[0].path;
            }
        }

        if (req.body.preferredExams) {
            try {
                const pExams = typeof req.body.preferredExams === 'string' ? JSON.parse(req.body.preferredExams) : req.body.preferredExams;
                if (pExams.length > 5) {
                    res.status(400);
                    throw new Error('Maximum 5 preferred exams allowed');
                }
                user.preferredExams = pExams;

                // Sync legacy fields
                const selectedExamsData = await Exam.find({ _id: { $in: pExams } });
                const examNames = selectedExamsData.map(e => e.name);
                user.exams = examNames;
                user.examHashtags = examNames;
            } catch (e) {
                console.error('Error parsing preferredExams:', e);
            }
        }

        if (req.body.receiveAllNotifications !== undefined) {
            user.receiveAllNotifications = req.body.receiveAllNotifications === 'true' || req.body.receiveAllNotifications === true;
        }

        if (req.body.exams) {
            try {
                user.exams = typeof req.body.exams === 'string' ? JSON.parse(req.body.exams) : req.body.exams;
            } catch (e) {
                console.error('Error parsing exams:', e);
            }
        }

        if (req.body.examHashtags) {
            try {
                user.examHashtags = typeof req.body.examHashtags === 'string' ? JSON.parse(req.body.examHashtags) : req.body.examHashtags;
            } catch (e) {
                console.error('Error parsing examHashtags:', e);
            }
        }

        if (req.body.notificationPreferences) {
            try {
                user.notificationPreferences = typeof req.body.notificationPreferences === 'string' ? JSON.parse(req.body.notificationPreferences) : req.body.notificationPreferences;
            } catch (e) {
                console.error('Error parsing notificationPreferences:', e);
            }
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const savedUser = await user.save();
        const updatedUser = await User.findById(savedUser._id).populate('preferredExams', 'name fullName category');
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            accountType: updatedUser.accountType,
            exams: updatedUser.exams,
            notificationPreferences: updatedUser.notificationPreferences,
            profilePic: updatedUser.profilePic,
            coverPic: updatedUser.coverPic,
            about: updatedUser.about,
            connectionsCount: updatedUser.connections.length,
            followersCount: updatedUser.followers.length,
            followingCount: updatedUser.following.length,
            token: generateToken(updatedUser._id),
            role: updatedUser.role,
            examHashtags: updatedUser.examHashtags || [],
            language: updatedUser.language,
            preferredExams: updatedUser.preferredExams,
            receiveAllNotifications: updatedUser.receiveAllNotifications,
            isVerified: updatedUser.isVerified,
            savedPosts: updatedUser.savedPosts,
            dailyQuizStreakCount: updatedUser.dailyQuizStreakCount,
            dailyGameStreakCount: updatedUser.dailyGameStreakCount
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Apply to be a Mentor
// @route   POST /api/users/apply-mentor
// @access  Private
const applyMentor = asyncHandler(async (req, res) => {
    const { experience, expertise } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Handle document upload
        let documentPath = '';
        if (req.file) {
            documentPath = req.file.path;
        }

        user.mentorApplication = {
            status: 'pending',
            appliedAt: new Date(),
            documents: documentPath ? [documentPath] : []
        };
        user.experience = experience;

        // Handle expertise - could be string or array
        if (typeof expertise === 'string') {
            user.expertise = expertise.split(',').map(s => s.trim());
        } else {
            user.expertise = Array.isArray(expertise) ? expertise : [expertise];
        }

        // Also update the convenience status field
        user.mentorApplicationStatus = 'pending';

        await user.save();
        res.json({ message: 'Mentor application submitted successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Apply to be an Academy
// @route   POST /api/users/apply-academy
// @access  Private
const applyAcademy = asyncHandler(async (req, res) => {
    const { academyName, location, website, description } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Handle document upload
        let documentPath = '';
        if (req.file) {
            documentPath = req.file.path;
        }

        user.academyApplication = {
            status: 'pending',
            appliedAt: new Date(),
            documents: documentPath ? [documentPath] : []
        };
        user.academyDetails = {
            academyName,
            location,
            website,
            description
        };

        // Also update the convenience status field
        user.academyApplicationStatus = 'pending';

        await user.save();
        res.json({ message: 'Academy application submitted successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const Connection = require('../models/Connection');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .populate('connections', 'name profilePic accountType')
        .populate('followers', 'name profilePic')
        .populate('following', 'name profilePic')
        .populate('preferredExams', 'name fullName category');

    if (user) {
        // Check connection status with the current user
        const connection = await Connection.findOne({
            $or: [
                { requester: req.user._id, recipient: user._id },
                { requester: user._id, recipient: req.user._id }
            ]
        });

        res.json({
            ...user.toObject(),
            connectionStatus: connection ? connection.status : 'none',
            isRequester: connection ? connection.requester.toString() === req.user._id.toString() : false,
            requestId: connection ? connection._id : null
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = asyncHandler(async (req, res) => {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
        res.status(404);
        throw new Error('User not found');
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollow._id.toString());
        userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
        // Follow
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);

        // Notify
        await createNotification(userToFollow._id, currentUser._id, 'follow');
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ isFollowing: !isFollowing });
});

// @desc    Search users (Dropdown)
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    console.log('Search Query Params:', req.query);

    const escapeRegex = (text) => {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    let keyword = {};
    if (req.query.q) {
        const regex = new RegExp(escapeRegex(req.query.q), 'gi');
        keyword = {
            name: { $regex: regex }
        };
    }

    // Search logic: Match name, exclude self, limit results
    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
        .select('name profilePic accountType about')
        .limit(10);

    console.log(`Search for "${req.query.q}" returned ${users.length} users`);

    res.json(users);
});

// @desc    Add recent search
// @route   POST /api/users/recent-search
// @access  Private
const addRecentSearch = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user._id);

    // Remove if exists to re-add at top
    user.recentSearches = user.recentSearches.filter(id => id.toString() !== targetUserId);

    // Add to top
    user.recentSearches.unshift(targetUserId);

    // Limit to 10
    if (user.recentSearches.length > 10) {
        user.recentSearches.pop();
    }

    await user.save();
    res.json(user.recentSearches);
});

// @desc    Get recent searches
// @route   GET /api/users/recent-search
// @access  Private
const getRecentSearches = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('recentSearches', 'name profilePic accountType');
    res.json(user.recentSearches);
});

// @desc    Clear recent searches
// @route   DELETE /api/users/recent-search
// @access  Private
const clearRecentSearches = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.recentSearches = [];
    await user.save();
    res.json({ message: 'Recent searches cleared' });
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
});

// @desc    Change user email
// @route   PUT /api/users/change-email
// @access  Private
const changeEmail = asyncHandler(async (req, res) => {
    const { newEmail, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Password is incorrect');
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
        res.status(400);
        throw new Error('Email already in use');
    }

    // Update email
    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email changed successfully', email: user.email });
});

// @desc    Delete user account with password verification (30-day grace period)
// @route   DELETE /api/users/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Password is incorrect');
    }

    // Schedule deletion for 30 days from now
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    user.deletionRequestedAt = new Date();
    user.scheduledDeletionDate = deletionDate;
    await user.save();

    res.json({
        message: 'Account deletion scheduled. You have 30 days to cancel by logging in.',
        scheduledDeletionDate: deletionDate
    });
});

// @desc    Update notification preferences
// @route   PUT /api/users/notification-preferences
// @access  Private
const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { notificationPreferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update notification preferences
    user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
    };

    await user.save();

    res.json({
        message: 'Notification preferences updated successfully',
        notificationPreferences: user.notificationPreferences
    });
});

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user) {
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

        // 5. Delete all posts by this user (optional, but recommended)
        const Post = require('../models/Post');
        await Post.deleteMany({ user: userId });

        // 6. Delete the user
        await User.findByIdAndDelete(userId);

        res.json({ message: 'User account deleted successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    getUsers,
    updateUserProfile,
    getUserById,
    toggleFollow,
    searchUsers,
    addRecentSearch,
    getRecentSearches,
    clearRecentSearches,
    deleteUser,
    applyMentor,
    applyAcademy,
    changePassword,
    changeEmail,
    deleteAccount,
    updateNotificationPreferences
};
