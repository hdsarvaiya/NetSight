const express = require('express');
const router = express.Router();
const {
    scanNetwork,
    saveDevices,
    getDevices,
    getInterfaces
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

// All device routes require authentication
router.get('/interfaces', protect, getInterfaces);
router.post('/scan', protect, scanNetwork);
router.post('/setup', protect, saveDevices);
router.get('/', protect, getDevices);

module.exports = router;
