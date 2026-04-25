const asyncHandler = require('express-async-handler');
const Device = require('../models/deviceModel');
const DeviceMetric = require('../models/deviceMetricModel');
const Settings = require('../models/settingsModel');
const Agent = require('../models/agentModel');
const { checkAlerts } = require('../utils/alertChecker');
const socketIO = require('../utils/socket');

// @desc    Validate agent key and return org info
// @route   POST /api/v1/agent/validate
// @access  Agent
const validateAgent = asyncHandler(async (req, res) => {
    const agent = req.agent;

    // Update agent status
    agent.status = 'Online';
    agent.lastSeen = new Date();
    if (req.body.hostname) agent.hostname = req.body.hostname;
    if (req.body.localIp) agent.localIp = req.body.localIp;
    if (req.body.agentVersion) agent.agentVersion = req.body.agentVersion;
    await agent.save();

    // Get org settings
    const settings = await Settings.findOne({ user: { $exists: true } });

    res.json({
        success: true,
        agent: {
            id: agent._id,
            name: agent.name,
            organization: agent.organization,
        },
        settings: {
            latencyThreshold: settings?.latencyThreshold ?? 50,
            packetLossThreshold: settings?.packetLossThreshold ?? 1,
            cpuThreshold: settings?.cpuThreshold ?? 80,
            memoryThreshold: settings?.memoryThreshold ?? 85,
        }
    });
});

// @desc    Agent heartbeat — keep alive signal
// @route   POST /api/v1/agent/heartbeat
// @access  Agent
const agentHeartbeat = asyncHandler(async (req, res) => {
    const agent = req.agent;
    const { hostname, localIp, agentVersion, scanCidr, stats } = req.body;

    agent.status = 'Online';
    agent.lastSeen = new Date();
    if (hostname) agent.hostname = hostname;
    if (localIp) agent.localIp = localIp;
    if (agentVersion) agent.agentVersion = agentVersion;
    if (scanCidr) agent.scanCidr = scanCidr;
    await agent.save();

    // Emit agent status via WebSocket so frontend can show live status
    const io = socketIO.getIO();
    if (io) {
        io.emit('agent_status', {
            agentId: agent._id,
            name: agent.name,
            status: 'Online',
            lastSeen: agent.lastSeen,
            hostname: agent.hostname,
            stats: stats || {}
        });
    }

    res.json({ success: true, message: 'Heartbeat received' });
});

// @desc    Receive scan results from agent
// @route   POST /api/v1/agent/scan-results
// @access  Agent
const handleScanResults = asyncHandler(async (req, res) => {
    const { devices } = req.body;
    const organization = req.organization;

    if (!devices || !Array.isArray(devices) || devices.length === 0) {
        res.status(400);
        throw new Error('No devices provided');
    }

    console.log(`[AGENT] Received scan results: ${devices.length} devices for org ${organization}`);

    let added = 0;
    let updated = 0;

    for (const d of devices) {
        // Try to find existing device by IP or MAC within this org
        const existing = await Device.findOne({
            organization,
            $or: [{ ip: d.ip }, { mac: d.mac }]
        });

        if (existing) {
            // Update existing device
            existing.status = d.status || 'Online';
            existing.hostname = d.hostname || existing.hostname;
            existing.vendor = d.vendor || existing.vendor;
            existing.type = d.type || existing.type;
            existing.openPorts = d.openPorts || existing.openPorts;
            existing.isGateway = d.isGateway ?? existing.isGateway;
            existing.mac = d.mac || existing.mac;
            if (!existing.name && d.hostname) existing.name = d.hostname;
            // Save metrics if provided (piggybacked from agent monitor)
            if (d.latency !== undefined) existing.latency = d.latency;
            if (d.packetLoss !== undefined) existing.packetLoss = d.packetLoss;
            if (d.cpuUsage !== undefined) existing.cpuUsage = d.cpuUsage;
            if (d.memoryUsage !== undefined) existing.memoryUsage = d.memoryUsage;
            if (d.trafficIn !== undefined) existing.trafficIn = d.trafficIn;
            if (d.trafficOut !== undefined) existing.trafficOut = d.trafficOut;
            if (d.status === 'Online') existing.lastSeen = new Date();
            await existing.save();
            updated++;
        } else {
            // Find a user in this org to associate the device with
            const User = require('../models/userModel');
            const orgUser = await User.findOne({ organization });
            if (!orgUser) continue;

            await Device.create({
                user: orgUser._id,
                organization,
                ip: d.ip,
                mac: d.mac,
                type: d.type || 'Other',
                status: d.status || 'Online',
                name: d.hostname || '',
                hostname: d.hostname || '',
                vendor: d.vendor || 'Unknown',
                openPorts: d.openPorts || [],
                isGateway: d.isGateway || false,
            });
            added++;
        }
    }

    // Emit device list update via WebSocket
    const io = socketIO.getIO();
    if (io) {
        io.emit('devices_updated', { organization, added, updated, total: devices.length });
    }

    console.log(`[AGENT] Scan processed: ${added} added, ${updated} updated`);

    res.json({
        success: true,
        added,
        updated,
        total: devices.length
    });
});

// @desc    Receive device metrics from agent
// @route   POST /api/v1/agent/metrics
// @access  Agent
const handleMetrics = asyncHandler(async (req, res) => {
    const { metrics } = req.body;
    const organization = req.organization;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        res.status(400);
        throw new Error('No metrics provided');
    }

    const io = socketIO.getIO();

    // Get settings for alert checking
    const User = require('../models/userModel');
    const orgUser = await User.findOne({ organization });
    let userSettings = null;
    if (orgUser) {
        userSettings = await Settings.findOne({ user: orgUser._id });
    }

    let processed = 0;

    for (const m of metrics) {
        // Find the device by IP in this org
        const device = await Device.findOne({ organization, ip: m.ip });
        if (!device) continue;

        const previousStatus = device.status;
        const currentStatus = m.status || (m.alive ? 'Online' : 'Offline');

        // Update device metrics in DB
        device.status = currentStatus;
        device.latency = m.latency || 0;
        device.packetLoss = m.packetLoss || 0;
        device.cpuUsage = m.cpuUsage || 0;
        device.memoryUsage = m.memoryUsage || 0;
        device.trafficIn = m.trafficIn || 0;
        device.trafficOut = m.trafficOut || 0;
        if (currentStatus === 'Online') {
            device.uptime = (device.uptime || 0) + (m.pollInterval || 5000) / 1000;
            device.lastSeen = new Date();
            if (previousStatus === 'Offline' || !device.onlineSince) {
                device.onlineSince = new Date();
            }
        }
        await device.save();

        // Emit status change via WebSocket
        if (previousStatus !== currentStatus && io) {
            io.emit('device_status_changed', {
                deviceId: device._id,
                ip: device.ip,
                name: device.name || device.hostname || device.ip,
                status: currentStatus,
                latency: device.latency,
            });
        }

        // Save time-series metric (sample ~2% of polls for storage efficiency)
        if (Math.random() < 0.02) {
            await DeviceMetric.create({
                device: device._id,
                user: device.user,
                organization: device.organization,
                timestamp: new Date(),
                status: currentStatus,
                latency: device.latency,
                packetLoss: device.packetLoss,
                cpuUsage: device.cpuUsage,
                memoryUsage: device.memoryUsage,
                trafficIn: device.trafficIn,
                trafficOut: device.trafficOut,
            });
        }

        // Check alert thresholds
        const deviceMetrics = {
            status: currentStatus,
            latency: device.latency,
            packetLoss: device.packetLoss,
            cpuUsage: device.cpuUsage,
            memoryUsage: device.memoryUsage,
        };
        await checkAlerts(device, deviceMetrics, userSettings);

        processed++;
    }

    res.json({ success: true, processed });
});

// @desc    Get device list for agent to poll
// @route   GET /api/v1/agent/devices
// @access  Agent
const getAgentDevices = asyncHandler(async (req, res) => {
    const devices = await Device.find({ organization: req.organization }, 'ip mac type name hostname openPorts isGateway status');

    res.json({
        success: true,
        count: devices.length,
        devices: devices.map(d => ({
            ip: d.ip,
            mac: d.mac,
            type: d.type,
            name: d.name || d.hostname || d.ip,
            openPorts: d.openPorts,
            isGateway: d.isGateway,
        }))
    });
});

// @desc    Get alert threshold settings for agent
// @route   GET /api/v1/agent/settings
// @access  Agent
const getAgentSettings = asyncHandler(async (req, res) => {
    const User = require('../models/userModel');
    const orgUser = await User.findOne({ organization: req.organization });
    let settings = null;
    if (orgUser) {
        settings = await Settings.findOne({ user: orgUser._id });
    }

    res.json({
        success: true,
        settings: {
            latencyThreshold: settings?.latencyThreshold ?? 50,
            packetLossThreshold: settings?.packetLossThreshold ?? 1,
            cpuThreshold: settings?.cpuThreshold ?? 80,
            memoryThreshold: settings?.memoryThreshold ?? 85,
        }
    });
});

module.exports = {
    validateAgent,
    agentHeartbeat,
    handleScanResults,
    handleMetrics,
    getAgentDevices,
    getAgentSettings,
};
