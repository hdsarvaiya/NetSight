const express = require('express');
const router = express.Router();
const { getAuditLogs, exportAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.get('/export', protect, exportAuditLogs);
router.get('/', protect, getAuditLogs);

module.exports = router;
