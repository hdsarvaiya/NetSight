const express = require('express');
const router = express.Router();
const {
    validateAgent,
    agentHeartbeat,
    handleScanResults,
    handleMetrics,
    getAgentDevices,
    getAgentSettings,
} = require('../controllers/agentController');
const { protectAgent } = require('../middleware/agentMiddleware');

// All agent routes require agent key authentication
router.post('/validate', protectAgent, validateAgent);
router.post('/heartbeat', protectAgent, agentHeartbeat);
router.post('/scan-results', protectAgent, handleScanResults);
router.post('/metrics', protectAgent, handleMetrics);
router.get('/devices', protectAgent, getAgentDevices);
router.get('/settings', protectAgent, getAgentSettings);

module.exports = router;
