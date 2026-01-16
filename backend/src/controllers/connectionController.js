const asyncHandler = require('express-async-handler');
const Connection = require('../models/Connection');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Private
const { createNotification } = require('../utils/notificationHelper');

const sendConnectionRequest = asyncHandler(async (req, res) => {
    const { recipientId } = req.body;

    const existingConnection = await Connection.findOne({
        $or: [
            { requester: req.user._id, recipient: recipientId },
            { requester: recipientId, recipient: req.user._id }
        ]
    });

    if (existingConnection) {
        res.status(400);
        throw new Error(existingConnection.status === 'accepted' ? 'Already connected' : 'Connection request already exists');
    }

    const connection = new Connection({
        requester: req.user._id,
        recipient: recipientId,
        status: 'pending'
    });

    await connection.save();

    // Notification
    await createNotification(recipientId, req.user._id, 'connection_request');

    res.status(201).json({ message: 'Request sent' });
});

const respondToRequest = asyncHandler(async (req, res) => {
    const { requestId, status } = req.body;

    const connection = await Connection.findById(requestId);

    if (!connection) {
        res.status(404);
        throw new Error('Request not found');
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    connection.status = status;
    await connection.save();

    if (status === 'accepted') {
        const requester = await User.findById(connection.requester);
        const recipient = await User.findById(connection.recipient);

        // Prevent duplicates in User.connections
        if (!requester.connections.includes(recipient._id)) {
            requester.connections.push(recipient._id);
        }
        if (!recipient.connections.includes(requester._id)) {
            recipient.connections.push(requester._id);
        }

        await requester.save();
        await recipient.save();

        // Notification to requester
        await createNotification(connection.requester, req.user._id, 'connection_accepted');
    }

    res.json({ message: `Request ${status}` });
});

const getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        recipient: req.user._id,
        status: 'pending'
    }).populate('requester', 'name profilePic accountType');
    res.json(requests);
});

// @desc    Get all confirmed connections
// @route   GET /api/connections
// @access  Private
const getConnections = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('connections', 'name profilePic accountType about');
    res.json(user.connections);
});

// @desc    Get all users with connection status (Discover)
// @route   GET /api/connections/suggestions
// @access  Private
const getSuggestions = asyncHandler(async (req, res) => {
    const search = req.query.search || '';

    // 1. Find all users (filtered by search if present)
    const query = {
        _id: { $ne: req.user._id }
    };
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    // Limit to 50 for performance in this demo
    const users = await User.find(query)
        .select('name profilePic accountType about')
        .limit(50);

    // 2. Fetch all connections involving the current user
    const myConnections = await Connection.find({
        $or: [
            { requester: req.user._id },
            { recipient: req.user._id }
        ]
    });

    // 3. Map and filter users
    const enrichedUsers = users.map(user => {
        const conn = myConnections.find(c =>
            (c.requester.toString() === user._id.toString()) ||
            (c.recipient.toString() === user._id.toString())
        );

        let status = 'none';
        let requestId = null;

        if (conn) {
            requestId = conn._id;
            if (conn.status === 'accepted') {
                status = 'connected';
            } else if (conn.status === 'pending') {
                status = conn.requester.toString() === req.user._id.toString() ? 'sent' : 'received';
            }
        }

        return {
            ...user.toObject(),
            connectionStatus: status,
            requestId
        };
    }).filter(u => u.connectionStatus !== 'connected');

    res.json(enrichedUsers);
});

// @desc    Remove a connection
// @route   DELETE /api/connections/:id
// @access  Private
const removeConnection = asyncHandler(async (req, res) => {
    const friendId = req.params.id;
    const userId = req.user._id;

    // 1. Remove from User.connections for both
    await User.findByIdAndUpdate(userId, { $pull: { connections: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { connections: userId } });

    // 2. Remove the Connection document
    await Connection.findOneAndDelete({
        $or: [
            { requester: userId, recipient: friendId },
            { requester: friendId, recipient: userId }
        ]
    });

    res.json({ message: 'Connection removed' });
});

// @desc    Get requests sent by user
// @route   GET /api/connections/sent
// @access  Private
const getSentRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        requester: req.user._id,
        status: 'pending'
    }).populate('recipient', 'name profilePic accountType');
    res.json(requests);
});

// @desc    Withdraw a connection request
// @route   DELETE /api/connections/withdraw/:id
// @access  Private
const withdrawRequest = asyncHandler(async (req, res) => {
    const connection = await Connection.findById(req.params.id);

    if (connection) {
        if (connection.requester.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized');
        }
        if (connection.status !== 'pending') {
            res.status(400);
            throw new Error('Can only withdraw pending requests');
        }
        await connection.deleteOne();
        res.json({ message: 'Request withdrawn' });
    } else {
        res.status(404);
        throw new Error('Request not found');
    }
});

module.exports = {
    sendConnectionRequest,
    respondToRequest,
    getPendingRequests,
    getSentRequests,
    getConnections,
    getSuggestions,
    removeConnection,
    withdrawRequest
};
