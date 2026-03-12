const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getMonitoredDevices,
    getLatencyTrend,
    getPerformanceTrend,
    getDeviceDistribution,
    getAlerts,
    getTrafficData,
    acknowledgeAlert,
} = require('../controllers/monitoringController');
const { protect } = require('../middleware/authMiddleware');

// All monitoring routes require authentication
router.get('/dashboard', protect, getDashboardStats);
router.get('/devices', protect, getMonitoredDevices);
router.get('/latency-trend', protect, getLatencyTrend);
router.get('/performance-trend', protect, getPerformanceTrend);
router.get('/device-distribution', protect, getDeviceDistribution);
router.get('/alerts', protect, getAlerts);
router.get('/traffic', protect, getTrafficData);
router.put('/alerts/:id/acknowledge', protect, acknowledgeAlert);

module.exports = router;
