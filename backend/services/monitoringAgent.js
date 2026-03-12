const ping = require('ping');
const Device = require('../models/deviceModel');
const DeviceMetric = require('../models/deviceMetricModel');
const Alert = require('../models/alertModel');

const POLL_INTERVAL = 2000; // 2 seconds
let pollingTimer = null;
let isPolling = false;

// ─── Alert Thresholds ───
const THRESHOLDS = {
    latencyWarning: 100,      // ms
    packetLossWarning: 5,     // %
    cpuWarning: 90,           // %
    memoryWarning: 90,        // %
};

// ─── Simulate SNMP-like metrics ───
// In production, replace with real SNMP using net-snmp
function simulateDeviceMetrics(device, isAlive) {
    if (!isAlive) {
        return { cpuUsage: 0, memoryUsage: 0, trafficIn: 0, trafficOut: 0, uptime: 0 };
    }

    // Simulate realistic metrics based on device type
    const baseLoad = device.type === 'Server' ? 45 : device.type === 'Router' ? 30 : 20;
    const variance = Math.random() * 20 - 10; // ±10%

    return {
        cpuUsage: Math.max(0, Math.min(100, Math.round(baseLoad + variance))),
        memoryUsage: Math.max(0, Math.min(100, Math.round(baseLoad + 15 + (Math.random() * 15)))),
        trafficIn: Math.round(Math.random() * 5000000 + 1000000),    // 1-6 MB
        trafficOut: Math.round(Math.random() * 3000000 + 500000),     // 0.5-3.5 MB
        uptime: device.uptime ? device.uptime + 2 : Math.round(Math.random() * 864000), // accumulate or random
    };
}

// ─── Check thresholds and create alerts ───
async function checkAlerts(device, metrics) {
    const alerts = [];

    if (metrics.status === 'Offline') {
        alerts.push({
            user: device.user,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            severity: 'critical',
            message: `Device is unreachable (ping failed)`,
        });
    }

    if (metrics.latency > THRESHOLDS.latencyWarning && metrics.status === 'Online') {
        alerts.push({
            user: device.user,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            severity: 'warning',
            message: `High latency detected: ${metrics.latency}ms`,
        });
    }

    if (metrics.packetLoss > THRESHOLDS.packetLossWarning) {
        alerts.push({
            user: device.user,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            severity: 'warning',
            message: `High packet loss: ${metrics.packetLoss}%`,
        });
    }

    if (metrics.cpuUsage > THRESHOLDS.cpuWarning) {
        alerts.push({
            user: device.user,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            severity: 'warning',
            message: `CPU usage above ${THRESHOLDS.cpuWarning}%: ${metrics.cpuUsage}%`,
        });
    }

    if (metrics.memoryUsage > THRESHOLDS.memoryWarning) {
        alerts.push({
            user: device.user,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            severity: 'warning',
            message: `Memory usage above ${THRESHOLDS.memoryWarning}%: ${metrics.memoryUsage}%`,
        });
    }

    // Only create alerts if there are new ones
    // Avoid duplicate alerts within last 60 seconds
    for (const alert of alerts) {
        const recentAlert = await Alert.findOne({
            device: alert.device,
            message: alert.message,
            createdAt: { $gte: new Date(Date.now() - 60000) }
        });
        if (!recentAlert) {
            await Alert.create(alert);
        }
    }
}

// ─── Poll a single device ───
async function pollDevice(device) {
    try {
        const result = await ping.promise.probe(device.ip, {
            timeout: 2,
            min_reply: 1,
        });

        const isAlive = result.alive;
        const latency = isAlive ? Math.round(parseFloat(result.time) || 0) : 0;
        const packetLoss = isAlive ? parseFloat(result.packetLoss) || 0 : 100;

        // Get simulated SNMP metrics (replace with real SNMP in production)
        const simMetrics = simulateDeviceMetrics(device, isAlive);

        const metrics = {
            status: isAlive ? 'Online' : 'Offline',
            latency,
            packetLoss,
            ...simMetrics,
        };

        // Update device with latest metrics
        await Device.findByIdAndUpdate(device._id, {
            status: metrics.status,
            latency: metrics.latency,
            packetLoss: metrics.packetLoss,
            cpuUsage: metrics.cpuUsage,
            memoryUsage: metrics.memoryUsage,
            trafficIn: metrics.trafficIn,
            trafficOut: metrics.trafficOut,
            uptime: metrics.uptime,
            lastSeen: isAlive ? new Date() : device.lastSeen,
        });

        // Save time-series metric (save every 10th poll to reduce DB writes)
        // We save once every ~20 seconds instead of every 2 seconds
        if (Math.random() < 0.1) {
            await DeviceMetric.create({
                device: device._id,
                user: device.user,
                timestamp: new Date(),
                status: metrics.status,
                latency: metrics.latency,
                packetLoss: metrics.packetLoss,
                cpuUsage: metrics.cpuUsage,
                memoryUsage: metrics.memoryUsage,
                trafficIn: metrics.trafficIn,
                trafficOut: metrics.trafficOut,
            });
        }

        // Check alert thresholds
        await checkAlerts(device, metrics);

        return metrics;
    } catch (error) {
        // If ping throws, device is offline
        await Device.findByIdAndUpdate(device._id, {
            status: 'Offline',
            latency: 0,
            packetLoss: 100,
        });
        return { status: 'Offline', latency: 0, packetLoss: 100 };
    }
}

// ─── Main polling loop ───
async function pollAllDevices() {
    if (isPolling) return; // Skip if previous poll still running
    isPolling = true;

    try {
        const devices = await Device.find({ user: { $ne: null }, ip: { $ne: null } });
        if (devices.length === 0) {
            isPolling = false;
            return;
        }

        // Poll all devices concurrently
        await Promise.all(devices.map(d => pollDevice(d)));
    } catch (error) {
        console.error('[MONITOR] Poll error:', error.message);
    } finally {
        isPolling = false;
    }
}

// ─── Start/Stop monitoring ───
function startMonitoring() {
    if (pollingTimer) return;
    console.log(`[MONITOR] Starting monitoring agent (${POLL_INTERVAL}ms interval)`);
    // First poll immediately
    pollAllDevices();
    // Then repeat
    pollingTimer = setInterval(pollAllDevices, POLL_INTERVAL);
}

function stopMonitoring() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        console.log('[MONITOR] Monitoring agent stopped');
    }
}

module.exports = { startMonitoring, stopMonitoring };
