const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getMonitoredDevices,
    getDeviceById,
    getDeviceMetrics,
    getLatencyTrend,
    getPerformanceTrend,
    getDeviceDistribution,
    getAlerts,
    getTrafficData,
    acknowledgeAlert,
    resolveAlert,
    getTopologyData,
    getPredictionData,
} = require('../controllers/monitoringController');
const { protect } = require('../middleware/authMiddleware');

// All monitoring routes require authentication
router.get('/dashboard', protect, getDashboardStats);
router.get('/devices', protect, getMonitoredDevices);
router.get('/devices/:id', protect, getDeviceById);
router.get('/devices/:id/metrics', protect, getDeviceMetrics);
router.get('/latency-trend', protect, getLatencyTrend);
router.get('/performance-trend', protect, getPerformanceTrend);
router.get('/device-distribution', protect, getDeviceDistribution);
router.get('/alerts', protect, getAlerts);
router.get('/traffic', protect, getTrafficData);
router.put('/alerts/:id/acknowledge', protect, acknowledgeAlert);
router.put('/alerts/:id/resolve', protect, resolveAlert);
router.get('/topology', protect, getTopologyData);
router.get('/prediction', protect, getPredictionData);

module.exports = router;
