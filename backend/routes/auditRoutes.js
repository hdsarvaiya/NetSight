const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogsExport } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.get('/export', protect, getAuditLogsExport);
router.get('/', protect, getAuditLogs);

module.exports = router;
