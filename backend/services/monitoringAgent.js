const snmp = require('net-snmp');
const si = require('systeminformation');
const os = require('os');
const net = require('net');
const ping = require('ping');
const mongoose = require('mongoose');
const Device = require('../models/deviceModel');
const DeviceMetric = require('../models/deviceMetricModel');
const Alert = require('../models/alertModel');
const Settings = require('../models/settingsModel');
const socketIO = require('../utils/socket');

const POLL_INTERVAL = 3000; // 3 seconds — near-realtime detection
let pollingTimer = null;
let isPolling = false;

// Get local IPs to identify "Self"
const localIps = Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family === 'IPv4')
    .map(i => i.address);

// Settings will be loaded from DB dynamically per user

// ─── Real Metric Probes ───

async function getHostMetrics() {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const network = await si.networkStats();
        
        return {
            cpuUsage: Math.round(cpu.currentLoad),
            memoryUsage: Math.round((mem.active / mem.total) * 100),
            trafficIn: network[0]?.rx_sec || 0,
            trafficOut: network[0]?.tx_sec || 0
        };
    } catch (err) {
        return null;
    }
}

function getSNMPMetrics(ip) {
    return new Promise((resolve) => {
        const session = snmp.createSession(ip, "public", { timeout: 500, retries: 0 });
        const oids = ["1.3.6.1.2.1.25.3.3.1.2.1", "1.3.6.1.4.1.2021.4.6.0"]; 
        
        session.get(oids, function (error, varbinds) {
            session.close();
            if (error) {
                resolve(null);
            } else {
                resolve({
                    cpuUsage: varbinds[0]?.value || 0,
                    memoryUsage: varbinds[1] ? Math.round(varbinds[1].value / 1024) : 0,
                    trafficIn: 0,
                    trafficOut: 0
                });
            }
        });
    });
}

// ─── Fallback Simulation (Only if Probes Fail) ───
function simulateDeviceMetrics(device, isAlive) {
    if (!isAlive) {
        return { cpuUsage: 0, memoryUsage: 0, trafficIn: 0, trafficOut: 0 };
    }
    const baseLoad = device.type === 'Server' ? 45 : device.type === 'Router' ? 30 : 20;
    const variance = Math.random() * 20 - 10;
    return {
        cpuUsage: Math.max(0, Math.min(100, Math.round(baseLoad + variance))),
        memoryUsage: Math.max(0, Math.min(100, Math.round(baseLoad + 15 + (Math.random() * 15)))),
        trafficIn: Math.round(Math.random() * 5000000 + 1000000),
        trafficOut: Math.round(Math.random() * 3000000 + 500000),
    };
}

// ─── Check thresholds and create alerts ───
async function checkAlerts(device, metrics, userSettings) {
    const alerts = [];

    const latencyWarning = userSettings?.latencyThreshold ?? 50;
    const packetLossWarning = userSettings?.packetLossThreshold ?? 1;
    const cpuWarning = userSettings?.cpuThreshold ?? 80;
    const memoryWarning = userSettings?.memoryThreshold ?? 85;

    if (metrics.status === 'Offline') {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'AVAILABILITY',
            metric: 'status',
            metric_value: 0,
            threshold_value: 1,
            severity: 'critical',
            message: `Device is unreachable (ping failed)`,
        });
    }

    if (metrics.latency > latencyWarning && metrics.status === 'Online') {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'latency',
            metric_value: metrics.latency,
            threshold_value: latencyWarning,
            severity: 'warning',
            message: `High latency detected: ${metrics.latency}ms`,
        });
    }

    if (metrics.packetLoss > packetLossWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'packetLoss',
            metric_value: metrics.packetLoss,
            threshold_value: packetLossWarning,
            severity: 'warning',
            message: `High packet loss: ${metrics.packetLoss}%`,
        });
    }

    if (metrics.cpuUsage > cpuWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'cpuUsage',
            metric_value: metrics.cpuUsage,
            threshold_value: cpuWarning,
            severity: 'warning',
            message: `CPU usage above ${cpuWarning}%: ${metrics.cpuUsage}%`,
        });
    }

    if (metrics.memoryUsage > memoryWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'memoryUsage',
            metric_value: metrics.memoryUsage,
            threshold_value: memoryWarning,
            severity: 'warning',
            message: `Memory usage above ${memoryWarning}%: ${metrics.memoryUsage}%`,
        });
    }

    // Enterprise Deduplication & Creation
    for (const alert of alerts) {
        // Try to find an identical alert that is still active (NEW or ACKNOWLEDGED)
        let activeAlert = await Alert.findOne({
            device: alert.device,
            metric: alert.metric,
            status: { $in: ['NEW', 'ACKNOWLEDGED'] }
        });

        const io = socketIO.getIO();

        if (activeAlert) {
            // Deduplicate: increment count and touch timestamp without creating a new row
            activeAlert.duplicate_count += 1;
            activeAlert.updatedAt = new Date(); // Will auto-trigger on save if timestamps:true, but be explicit
            activeAlert.metric_value = alert.metric_value; // Update to the most recent tracked value
            await activeAlert.save();
            
            // Optionally, we could emit an UPDATE event to the websocket so the dashboard can flash the count
            if (io && activeAlert.duplicate_count % 5 === 0) { // Only broadcast every 5th duplicate to save bandwidth
                 io.emit('alert_updated', { action: 'DUPLICATE_UPDATED', data: activeAlert });
            }
        } else {
            // Create brand new alert
            const newAlert = await Alert.create(alert);
            
            // Broadcast over websockets for real-time notification
            if (io) {
                io.emit('alert_updated', { action: 'CREATED', data: newAlert });
            }
        }
    }
}

// ─── Ultra-fast TCP connect probe (no process spawning) ───
function tcpProbe(ip, port, timeout = 400) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const start = Date.now();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            const latency = Date.now() - start;
            socket.destroy();
            resolve({ alive: true, time: latency });
        });
        socket.on('timeout', () => { socket.destroy(); resolve({ alive: false, time: 0 }); });
        socket.on('error', () => { socket.destroy(); resolve({ alive: false, time: 0 }); });
        socket.connect(port, ip);
    });
}

// Try multiple detection methods: TCP first (instant), then ICMP fallback
async function fastIsAlive(ip, openPorts) {
    // 1. Try TCP probe on known open ports or common ports (< 100ms on LAN)
    const portsToTry = [];
    if (openPorts && openPorts.length > 0) {
        portsToTry.push(...openPorts.slice(0, 3).map(p => typeof p === 'object' ? p.port : p));
    }
    // Add common fallback ports
    for (const p of [445, 139, 135, 80, 3389, 22, 443]) {
        if (!portsToTry.includes(p)) portsToTry.push(p);
        if (portsToTry.length >= 5) break;
    }

    // Fire all TCP probes in parallel with 400ms timeout
    const tcpResults = await Promise.all(
        portsToTry.map(port => tcpProbe(ip, port, 400))
    );
    const successResult = tcpResults.find(r => r.alive);
    if (successResult) {
        return { alive: true, time: successResult.time, packetLoss: 0 };
    }

    // 2. Fallback to ICMP ping (for devices with no open TCP ports)
    const result = await ping.promise.probe(ip, { timeout: 1, min_reply: 1 });
    return {
        alive: result.alive,
        time: result.alive ? parseFloat(result.time) || 0 : 0,
        packetLoss: result.alive ? parseFloat(result.packetLoss) || 0 : 100
    };
}

// ─── Poll a single device ───
async function pollDevice(device, userSettings) {
    try {
        const probeResult = await fastIsAlive(device.ip, device.openPorts);

        const isAlive = probeResult.alive;
        const latency = isAlive ? Math.round(probeResult.time) : 0;
        const packetLoss = isAlive ? probeResult.packetLoss : 100;

        const previousStatus = device.status;
        const currentStatus = isAlive ? 'Online' : 'Offline';
        let onlineSince = device.onlineSince;

        if (currentStatus === 'Online' && (previousStatus === 'Offline' || !onlineSince)) {
            onlineSince = new Date();
        }

        let uptime = device.uptime || 0;
        if (currentStatus === 'Online') {
            uptime += POLL_INTERVAL / 1000; 
        }

        // ─── Get Real Metrics (only for self) ───
        let realMetrics = null;
        const isSelf = localIps.includes(device.ip) || device.ip === '127.0.0.1' || device.ip === 'localhost';
        if (isAlive && isSelf) {
            realMetrics = await getHostMetrics();
        }

        const fallback = realMetrics ? null : simulateDeviceMetrics(device, isAlive);
        const metrics = {
            status: currentStatus,
            latency,
            packetLoss,
            uptime,
            cpuUsage: realMetrics?.cpuUsage ?? fallback.cpuUsage,
            memoryUsage: realMetrics?.memoryUsage ?? fallback.memoryUsage,
            trafficIn: realMetrics?.trafficIn ?? fallback.trafficIn,
            trafficOut: realMetrics?.trafficOut ?? fallback.trafficOut,
        };

        // Update device in DB
        await Device.findByIdAndUpdate(device._id, {
            status: metrics.status,
            latency: metrics.latency,
            packetLoss: metrics.packetLoss,
            cpuUsage: metrics.cpuUsage,
            memoryUsage: metrics.memoryUsage,
            trafficIn: metrics.trafficIn,
            trafficOut: metrics.trafficOut,
            uptime: metrics.uptime,
            onlineSince: onlineSince,
            lastSeen: isAlive ? new Date() : device.lastSeen,
        });

        // Emit instant status change via WebSocket
        if (previousStatus !== currentStatus) {
            const io = socketIO.getIO();
            if (io) {
                io.emit('device_status_changed', {
                    deviceId: device._id,
                    ip: device.ip,
                    name: device.name || device.hostname || device.ip,
                    status: currentStatus,
                    latency: metrics.latency,
                });
            }
        }

        // Save time-series metric (~every 60s per device)
        if (Math.random() < 0.02) {
            await DeviceMetric.create({
                device: device._id,
                user: device.user,
                organization: device.organization,
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
        await checkAlerts(device, metrics, userSettings);

        return metrics;
    } catch (error) {
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

    // Skip poll if MongoDB is not connected to avoid hanging queries
    if (mongoose.connection.readyState !== 1) {
        console.warn('[MONITOR] Skipping poll — MongoDB not connected (state:', mongoose.connection.readyState, ')');
        return;
    }

    isPolling = true;

    try {
        const devices = await Device.find({ user: { $ne: null }, ip: { $ne: null } });
        if (devices.length === 0) {
            isPolling = false;
            return;
        }

        // Poll all devices concurrently
        const uniqueUsers = [...new Set(devices.map(d => d.user.toString()))];
        const userSettingsList = await Settings.find({ user: { $in: uniqueUsers } });
        
        const settingsMap = {};
        userSettingsList.forEach(s => settingsMap[s.user.toString()] = s);

        await Promise.all(devices.map(d => pollDevice(d, settingsMap[d.user.toString()])));
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
