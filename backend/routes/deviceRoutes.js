const express = require('express');
const router = express.Router();
const {
    scanNetwork,
    saveDevices,
    addDevices,
    deleteDevice,
    getDevices,
    getInterfaces
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

// All device routes require authentication
router.get('/interfaces', protect, getInterfaces);
router.post('/scan', protect, scanNetwork);
router.post('/setup', protect, saveDevices);
router.post('/add', protect, addDevices);
router.get('/', protect, getDevices);
router.delete('/:id', protect, deleteDevice);

module.exports = router;
