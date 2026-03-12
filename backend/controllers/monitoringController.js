const asyncHandler = require('express-async-handler');
const Device = require('../models/deviceModel');
const DeviceMetric = require('../models/deviceMetricModel');
const Alert = require('../models/alertModel');

// @desc    Get dashboard summary stats
// @route   GET /api/v1/monitoring/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const devices = await Device.find({ user: userId });
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'Online').length;
    const offlineDevices = totalDevices - onlineDevices;

    // Average latency of online devices
    const onlineOnes = devices.filter(d => d.status === 'Online' && d.latency > 0);
    const avgLatency = onlineOnes.length > 0
        ? Math.round(onlineOnes.reduce((sum, d) => sum + d.latency, 0) / onlineOnes.length)
        : 0;

    // Uptime percentage
    const uptimePercent = totalDevices > 0
        ? ((onlineDevices / totalDevices) * 100).toFixed(1)
        : '0.0';

    // Active alerts
    const activeAlerts = await Alert.countDocuments({ user: userId, acknowledged: false });
    const criticalAlerts = await Alert.countDocuments({ user: userId, acknowledged: false, severity: 'critical' });

    // Total traffic
    const totalTrafficIn = devices.reduce((sum, d) => sum + (d.trafficIn || 0), 0);
    const totalTrafficOut = devices.reduce((sum, d) => sum + (d.trafficOut || 0), 0);

    // Average CPU and Memory
    const avgCpu = onlineOnes.length > 0
        ? Math.round(onlineOnes.reduce((sum, d) => sum + (d.cpuUsage || 0), 0) / onlineOnes.length)
        : 0;
    const avgMemory = onlineOnes.length > 0
        ? Math.round(onlineOnes.reduce((sum, d) => sum + (d.memoryUsage || 0), 0) / onlineOnes.length)
        : 0;

    res.json({
        success: true,
        stats: {
            totalDevices,
            onlineDevices,
            offlineDevices,
            avgLatency,
            uptimePercent: parseFloat(uptimePercent),
            activeAlerts,
            criticalAlerts,
            totalTrafficIn,
            totalTrafficOut,
            avgCpu,
            avgMemory,
        }
    });
});

// @desc    Get all devices with latest metrics
// @route   GET /api/v1/monitoring/devices
// @access  Private
const getMonitoredDevices = asyncHandler(async (req, res) => {
    const devices = await Device.find({ user: req.user._id }).sort({ status: 1, name: 1 });

    res.json({
        success: true,
        devices: devices.map(d => ({
            _id: d._id,
            name: d.name || d.hostname || d.ip,
            ip: d.ip,
            mac: d.mac,
            type: d.type,
            vendor: d.vendor,
            status: d.status,
            latency: d.latency,
            packetLoss: d.packetLoss,
            cpuUsage: d.cpuUsage,
            memoryUsage: d.memoryUsage,
            trafficIn: d.trafficIn,
            trafficOut: d.trafficOut,
            uptime: d.uptime,
            lastSeen: d.lastSeen,
            isGateway: d.isGateway,
            openPorts: d.openPorts,
        }))
    });
});

// @desc    Get latency trend (last 1 hour, grouped by 5-min intervals)
// @route   GET /api/v1/monitoring/latency-trend
// @access  Private
const getLatencyTrend = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const since = new Date(Date.now() - 3600000); // last 1 hour

    const metrics = await DeviceMetric.aggregate([
        { $match: { user: userId, timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    $dateTrunc: { date: '$timestamp', unit: 'minute', binSize: 5 }
                },
                avgLatency: { $avg: '$latency' },
                avgPacketLoss: { $avg: '$packetLoss' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    const trend = metrics.map(m => ({
        time: new Date(m._id).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: Math.round(m.avgLatency || 0),
        packetLoss: Math.round((m.avgPacketLoss || 0) * 10) / 10,
    }));

    // If not enough data, generate from current device states
    if (trend.length < 3) {
        const devices = await Device.find({ user: userId, status: 'Online' });
        const now = new Date();
        const syntheticTrend = [];
        for (let i = 11; i >= 0; i--) {
            const time = new Date(now - i * 5 * 60000);
            const baseLatency = devices.length > 0
                ? devices.reduce((s, d) => s + (d.latency || 0), 0) / devices.length
                : 0;
            syntheticTrend.push({
                time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                value: Math.round(baseLatency + (Math.random() * 10 - 5)),
            });
        }
        return res.json({ success: true, trend: syntheticTrend });
    }

    res.json({ success: true, trend });
});

// @desc    Get performance/uptime trend
// @route   GET /api/v1/monitoring/performance-trend
// @access  Private
const getPerformanceTrend = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const devices = await Device.find({ user: userId });
    const totalDevices = devices.length || 1;
    const now = new Date();

    // Generate uptime trend based on current state
    const trend = [];
    for (let i = 11; i >= 0; i--) {
        const time = new Date(now - i * 5 * 60000);
        const onlineCount = devices.filter(d => d.status === 'Online').length;
        const uptime = (onlineCount / totalDevices) * 100;
        trend.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            value: Math.round((uptime + (Math.random() * 2 - 1)) * 10) / 10,
        });
    }

    res.json({ success: true, trend });
});

// @desc    Get device type distribution
// @route   GET /api/v1/monitoring/device-distribution
// @access  Private
const getDeviceDistribution = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const distribution = await Device.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const colorMap = {
        'Router': '#d4af37',
        'Switch': '#4ade80',
        'Server': '#60a5fa',
        'Workstation': '#a855f7',
        'Access Point': '#f59e0b',
        'Printer': '#ec4899',
        'Firewall': '#ef4444',
        'Other': '#6b7280',
    };

    const data = distribution.map(d => ({
        name: d._id + 's',
        value: d.count,
        color: colorMap[d._id] || '#6b7280',
    }));

    res.json({ success: true, distribution: data });
});

// @desc    Get recent alerts
// @route   GET /api/v1/monitoring/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
    const alerts = await Alert.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

    const now = Date.now();
    const formattedAlerts = alerts.map(a => {
        const diff = now - new Date(a.createdAt).getTime();
        let timeAgo;
        if (diff < 60000) timeAgo = 'just now';
        else if (diff < 3600000) timeAgo = `${Math.floor(diff / 60000)} min ago`;
        else if (diff < 86400000) timeAgo = `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) > 1 ? 's' : ''} ago`;
        else timeAgo = `${Math.floor(diff / 86400000)} day${Math.floor(diff / 86400000) > 1 ? 's' : ''} ago`;

        return {
            _id: a._id,
            device: a.deviceName,
            deviceIp: a.deviceIp,
            message: a.message,
            severity: a.severity,
            time: timeAgo,
            acknowledged: a.acknowledged,
        };
    });

    res.json({ success: true, alerts: formattedAlerts });
});

// @desc    Get monthly traffic data
// @route   GET /api/v1/monitoring/traffic
// @access  Private
const getTrafficData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Aggregate traffic from metrics over last 24h grouped by hour
    const since = new Date(Date.now() - 86400000);
    const metrics = await DeviceMetric.aggregate([
        { $match: { user: userId, timestamp: { $gte: since } } },
        {
            $group: {
                _id: { $hour: '$timestamp' },
                totalIn: { $sum: '$trafficIn' },
                totalOut: { $sum: '$trafficOut' },
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    if (metrics.length >= 3) {
        const traffic = metrics.map(m => ({
            period: `${String(m._id).padStart(2, '0')}:00`,
            value: Math.round((m.totalIn + m.totalOut) / 1048576), // Convert to MB
        }));
        return res.json({ success: true, traffic });
    }

    // Fallback: generate from current device traffic
    const devices = await Device.find({ user: userId });
    const totalTraffic = devices.reduce((s, d) => s + (d.trafficIn || 0) + (d.trafficOut || 0), 0);
    const mbPerHour = Math.round(totalTraffic / 1048576);

    const now = new Date();
    const traffic = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 3600000);
        traffic.push({
            period: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            value: Math.round(mbPerHour * (0.5 + Math.random())),
        });
    }

    res.json({ success: true, traffic });
});

// @desc    Acknowledge an alert
// @route   PUT /api/v1/monitoring/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { acknowledged: true },
        { new: true }
    );

    if (!alert) {
        res.status(404);
        throw new Error('Alert not found');
    }

    res.json({ success: true, alert });
});

module.exports = {
    getDashboardStats,
    getMonitoredDevices,
    getLatencyTrend,
    getPerformanceTrend,
    getDeviceDistribution,
    getAlerts,
    getTrafficData,
    acknowledgeAlert,
};
