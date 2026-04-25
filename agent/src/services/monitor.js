const net = require('net');
const si = require('systeminformation');
const os = require('os');
const ping = require('ping');
const logger = require('./logger');
const serverApi = require('./serverApi');
const { loadConfig } = require('../config');

const localIps = Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family === 'IPv4')
    .map(i => i.address);

let pollingTimer = null;
let isPolling = false;
let deviceList = [];
let stats = { pollCount: 0, metricsSent: 0, lastPollTime: null };
let latestMetrics = [];

// Track previous device statuses to only log CHANGES (not every poll)
const previousStatuses = new Map();
let lastServerFetchAttempt = 0;

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
    } catch (err) { return null; }
}

// ─── Ultra-fast TCP connect probe ───
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

// ─── Multi-method alive check ───
async function fastIsAlive(ip, openPorts) {
    const portsToTry = [];
    if (openPorts && openPorts.length > 0) {
        portsToTry.push(...openPorts.slice(0, 3).map(p => typeof p === 'object' ? p.port : p));
    }
    for (const p of [445, 139, 135, 80, 3389, 22, 443]) {
        if (!portsToTry.includes(p)) portsToTry.push(p);
        if (portsToTry.length >= 5) break;
    }

    const tcpResults = await Promise.all(
        portsToTry.map(port => tcpProbe(ip, port, 400))
    );
    const successResult = tcpResults.find(r => r.alive);
    if (successResult) {
        return { alive: true, time: successResult.time, packetLoss: 0 };
    }

    const result = await ping.promise.probe(ip, { timeout: 1, min_reply: 1 });
    return {
        alive: result.alive,
        time: result.alive ? parseFloat(result.time) || 0 : 0,
        packetLoss: result.alive ? parseFloat(result.packetLoss) || 0 : 100
    };
}

// ─── Fallback simulation ───
function simulateDeviceMetrics(device, isAlive) {
    if (!isAlive) return { cpuUsage: 0, memoryUsage: 0, trafficIn: 0, trafficOut: 0 };
    const baseLoad = device.type === 'Server' ? 45 : device.type === 'Router' ? 30 : 20;
    const variance = Math.random() * 20 - 10;
    return {
        cpuUsage: Math.max(0, Math.min(100, Math.round(baseLoad + variance))),
        memoryUsage: Math.max(0, Math.min(100, Math.round(baseLoad + 15 + (Math.random() * 15)))),
        trafficIn: Math.round(Math.random() * 5000000 + 1000000),
        trafficOut: Math.round(Math.random() * 3000000 + 500000),
    };
}

// ─── Poll a single device ───
async function pollDevice(device) {
    try {
        const probeResult = await fastIsAlive(device.ip, device.openPorts);
        const isAlive = probeResult.alive;
        const latency = isAlive ? Math.round(probeResult.time) : 0;
        const packetLoss = isAlive ? probeResult.packetLoss : 100;
        const currentStatus = isAlive ? 'Online' : 'Offline';

        // Get real metrics for self device
        let realMetrics = null;
        const isSelf = localIps.includes(device.ip) || device.ip === '127.0.0.1';
        if (isAlive && isSelf) {
            realMetrics = await getHostMetrics();
        }

        const fallback = realMetrics ? null : simulateDeviceMetrics(device, isAlive);
        const config = loadConfig();

        return {
            ip: device.ip,
            status: currentStatus,
            latency,
            packetLoss,
            cpuUsage: realMetrics?.cpuUsage ?? fallback.cpuUsage,
            memoryUsage: realMetrics?.memoryUsage ?? fallback.memoryUsage,
            trafficIn: realMetrics?.trafficIn ?? fallback.trafficIn,
            trafficOut: realMetrics?.trafficOut ?? fallback.trafficOut,
            pollInterval: config.pollInterval,
            alive: isAlive,
        };
    } catch (error) {
        return {
            ip: device.ip, status: 'Offline', latency: 0, packetLoss: 100,
            cpuUsage: 0, memoryUsage: 0, trafficIn: 0, trafficOut: 0, alive: false,
        };
    }
}

// ─── Main polling loop ───
async function pollAllDevices() {
    if (isPolling) return;
    isPolling = true;

    try {
        // Only fetch from server if scanner hasn't provided any devices yet.
        // Scanner results (set via setDeviceList) always take priority.
        // Throttle server fetch attempts to once per 30s to avoid spam.
        if (deviceList.length === 0) {
            const now = Date.now();
            if (now - lastServerFetchAttempt > 30000) {
                lastServerFetchAttempt = now;
                const freshDevices = await serverApi.getDevices();
                if (freshDevices.length > 0) {
                    deviceList = freshDevices;
                    logger.info(`Loaded ${deviceList.length} devices from server`, 'monitor');
                }
            }
        }

        if (deviceList.length === 0) {
            // Only log once, not every poll cycle
            if (stats.pollCount === 0) {
                logger.info('Waiting for scan to discover devices...', 'monitor');
            }
            isPolling = false;
            return;
        }

        // Poll all devices concurrently
        const metrics = await Promise.all(deviceList.map(d => pollDevice(d)));

        // Store latest metrics for scan-result piggyback
        latestMetrics = metrics;

        // Count online/offline
        const online = metrics.filter(m => m.status === 'Online').length;
        const offline = metrics.filter(m => m.status === 'Offline').length;

        // Log only STATUS CHANGES (not every offline device every cycle)
        metrics.forEach(m => {
            const prevStatus = previousStatuses.get(m.ip);
            if (prevStatus !== m.status) {
                if (m.status === 'Offline') {
                    logger.warn(`${m.ip} → Offline`, 'monitor');
                } else if (prevStatus === 'Offline') {
                    logger.success(`${m.ip} → Online`, 'monitor');
                }
                previousStatuses.set(m.ip, m.status);
            }
        });

        logger.info(`Polled ${metrics.length} devices (${online}🟢 ${offline}🔴)`, 'monitor');

        // Send metrics — WebSocket every poll (lightweight), HTTP fallback every 6th
        stats.pollCount++;
        if (serverApi.isSocketConnected()) {
            // WebSocket is instant & fire-and-forget — send every poll
            serverApi.sendMetrics(metrics);
            stats.metricsSent += metrics.length;
        } else if (stats.pollCount % 6 === 0) {
            // HTTP fallback — only every 6th poll to avoid timeouts
            const result = await serverApi.sendMetrics(metrics);
            if (result) stats.metricsSent += metrics.length;
        }

        stats.lastPollTime = new Date();
    } catch (error) {
        logger.error(`Poll error: ${error.message}`, 'monitor');
    } finally {
        isPolling = false;
    }
}

// ─── Start/Stop monitoring ───
function startMonitoring(interval) {
    if (pollingTimer) return;
    const pollInterval = interval || loadConfig().pollInterval || 5000;
    logger.info(`Starting monitor (${pollInterval}ms interval, ${deviceList.length} devices)`, 'monitor');
    pollAllDevices();
    pollingTimer = setInterval(pollAllDevices, pollInterval);
}

function stopMonitoring() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        logger.info('Monitor stopped', 'monitor');
    }
}

function setDeviceList(devices) {
    deviceList = devices;
    // Clear status tracking for the new device set
    previousStatuses.clear();
}

function getMonitorStatus() {
    return {
        isRunning: !!pollingTimer,
        isPolling,
        deviceCount: deviceList.length,
        ...stats,
    };
}

function getLatestMetrics() {
    return latestMetrics;
}

module.exports = {
    startMonitoring,
    stopMonitoring,
    setDeviceList,
    getMonitorStatus,
    getLatestMetrics,
    isRunning: () => !!pollingTimer,
};
