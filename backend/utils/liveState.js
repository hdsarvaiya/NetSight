/**
 * LiveState — In-memory real-time device state.
 * Receives metrics from agent via WebSocket, relays to frontend,
 * and batch-writes to MongoDB every 5 minutes for historical data.
 */
const mongoose = require('mongoose');

// In-memory stores (keyed by organization)
const orgDevices = new Map();   // org → Map(ip → deviceData)
const orgStats = new Map();     // org → computed dashboard stats

let batchTimer = null;

// ─── Update from agent metrics ───
function updateFromMetrics(metrics, organization) {
    if (!orgDevices.has(organization)) {
        orgDevices.set(organization, new Map());
    }
    const devices = orgDevices.get(organization);

    metrics.forEach(m => {
        devices.set(m.ip, {
            ip: m.ip,
            status: m.status,
            latency: m.latency || 0,
            packetLoss: m.packetLoss || 0,
            cpuUsage: m.cpuUsage || 0,
            memoryUsage: m.memoryUsage || 0,
            trafficIn: m.trafficIn || 0,
            trafficOut: m.trafficOut || 0,
            alive: m.alive,
            lastUpdated: Date.now(),
        });
    });

    // Recompute stats
    const deviceList = Array.from(devices.values());
    const online = deviceList.filter(d => d.status === 'Online').length;
    const onlineDevices = deviceList.filter(d => d.status === 'Online' && d.latency > 0);
    const avgLatency = onlineDevices.length > 0
        ? Math.round(onlineDevices.reduce((s, d) => s + d.latency, 0) / onlineDevices.length)
        : 0;
    const totalTrafficIn = deviceList.reduce((s, d) => s + d.trafficIn, 0);
    const totalTrafficOut = deviceList.reduce((s, d) => s + d.trafficOut, 0);

    orgStats.set(organization, {
        totalDevices: deviceList.length,
        onlineDevices: online,
        offlineDevices: deviceList.length - online,
        avgLatency,
        uptimePercent: deviceList.length > 0 ? parseFloat(((online / deviceList.length) * 100).toFixed(1)) : 0,
        totalTrafficIn,
        totalTrafficOut,
    });
}

// ─── Update from scan results ───
function updateFromScan(devices, organization) {
    if (!orgDevices.has(organization)) {
        orgDevices.set(organization, new Map());
    }
    const store = orgDevices.get(organization);

    devices.forEach(d => {
        const existing = store.get(d.ip) || {};
        store.set(d.ip, {
            ...existing,
            ip: d.ip,
            hostname: d.hostname || existing.hostname,
            type: d.type || existing.type,
            vendor: d.vendor || existing.vendor,
            mac: d.mac || existing.mac,
            isGateway: d.isGateway ?? existing.isGateway,
            openPorts: d.openPorts || existing.openPorts,
            status: d.status || existing.status || 'Online',
            latency: d.latency ?? existing.latency ?? 0,
            packetLoss: d.packetLoss ?? existing.packetLoss ?? 0,
            lastUpdated: Date.now(),
        });
    });
}

// ─── Get snapshot for frontend ───
function getSnapshot(organization) {
    const devices = orgDevices.has(organization)
        ? Array.from(orgDevices.get(organization).values())
        : [];
    const stats = orgStats.get(organization) || {
        totalDevices: 0, onlineDevices: 0, offlineDevices: 0,
        avgLatency: 0, uptimePercent: 0, totalTrafficIn: 0, totalTrafficOut: 0,
    };
    return { devices, stats };
}

// ─── Get live devices for a specific org (for merging with DB data) ───
function getLiveDevices(organization) {
    if (!orgDevices.has(organization)) return [];
    return Array.from(orgDevices.get(organization).values());
}

function getLiveStats(organization) {
    return orgStats.get(organization) || null;
}

// ─── Batch writer — writes to MongoDB every 5 minutes ───
function startBatchWriter() {
    if (batchTimer) return;

    const BATCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    batchTimer = setInterval(async () => {
        if (mongoose.connection.readyState !== 1) {
            return; // Skip if DB not connected
        }

        try {
            const Device = require('../models/deviceModel');
            const DeviceMetric = require('../models/deviceMetricModel');

            for (const [organization, devices] of orgDevices.entries()) {
                for (const [ip, liveData] of devices.entries()) {
                    // Update Device document with latest metrics
                    const updated = await Device.findOneAndUpdate(
                        { organization, ip },
                        {
                            status: liveData.status,
                            latency: liveData.latency,
                            packetLoss: liveData.packetLoss,
                            cpuUsage: liveData.cpuUsage || 0,
                            memoryUsage: liveData.memoryUsage || 0,
                            trafficIn: liveData.trafficIn || 0,
                            trafficOut: liveData.trafficOut || 0,
                            ...(liveData.status === 'Online' ? { lastSeen: new Date() } : {}),
                        },
                        { new: true }
                    );

                    // Create time-series metric for historical charts
                    if (updated) {
                        await DeviceMetric.create({
                            device: updated._id,
                            user: updated.user,
                            organization,
                            timestamp: new Date(),
                            status: liveData.status,
                            latency: liveData.latency,
                            packetLoss: liveData.packetLoss,
                            cpuUsage: liveData.cpuUsage || 0,
                            memoryUsage: liveData.memoryUsage || 0,
                            trafficIn: liveData.trafficIn || 0,
                            trafficOut: liveData.trafficOut || 0,
                        });
                    }
                }
            }

            console.log('[LIVE] Batch write complete — synced live state to DB');
        } catch (err) {
            console.warn('[LIVE] Batch write failed:', err.message);
        }
    }, BATCH_INTERVAL);

    console.log('[LIVE] Batch writer started (5 min interval)');
}

function stopBatchWriter() {
    if (batchTimer) {
        clearInterval(batchTimer);
        batchTimer = null;
    }
}

module.exports = {
    updateFromMetrics,
    updateFromScan,
    getSnapshot,
    getLiveDevices,
    getLiveStats,
    startBatchWriter,
    stopBatchWriter,
};
