const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/export', [auth, admin], reportController.exportData);

module.exports = router;
