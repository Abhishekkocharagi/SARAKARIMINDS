const express = require('express');
const router = express.Router();
const { createJobUpdate, getAllJobUpdates, deleteJobUpdate, updateJobUpdate } = require('../controllers/jobUpdateController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, admin, createJobUpdate)
    .get(protect, admin, getAllJobUpdates);

router.route('/:id')
    .put(protect, admin, updateJobUpdate)
    .delete(protect, admin, deleteJobUpdate);

module.exports = router;
