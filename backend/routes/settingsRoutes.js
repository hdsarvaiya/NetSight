const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    generateAgentKey,
    revokeAgentKey,
    getAgents,
    downloadAgent,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

// Agent key management
router.get('/download-agent', protect, downloadAgent);
router.post('/agent-key', protect, generateAgentKey);
router.delete('/agent-key/:id', protect, revokeAgentKey);
router.get('/agents', protect, getAgents);

module.exports = router;
