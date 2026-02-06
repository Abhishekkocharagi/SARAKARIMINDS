const express = require('express');
const router = express.Router();
const { getSalesDashboardStats } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/sales-dashboard', protect, admin, getSalesDashboardStats);

module.exports = router;
