const express = require('express');
const router = express.Router();
const { getJobUpdateById, getPublicJobUpdates } = require('../controllers/jobUpdateController');

router.route('/').get(getPublicJobUpdates);
router.route('/:id').get(getJobUpdateById);

module.exports = router;
