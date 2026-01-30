const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');
const Topology = require('../models/Topology');
const { identifyDeviceType } = require('../utils/deviceClassifier');

// 1. Devices API
router.get('/devices', async (req, res) => {
    console.log('GET /api/devices - Fetching all devices');
    try {
        const devices = await Device.find();
        console.log(`Successfully fetched ${devices.length} devices.`);
        res.json(devices);
    } catch (err) {
        console.error(`Error fetching devices: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

const find = require('local-devices');

// Test Endpoint for Device Classification
router.post('/device/detect-type', async (req, res) => {
    try {
        const { ipAddress, community = 'public' } = req.body;
        if (!ipAddress) return res.status(400).json({ message: 'IP address required' });

        console.log(`Classifying device at ${ipAddress}...`);
        const result = await identifyDeviceType(ipAddress, req.body.macAddress, community);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/network/discover', async (req, res) => {
    console.log('POST /api/network/discover - Starting real network discovery');
    try {
        const { snmpCommunity = 'public', detectTypes = true } = req.body || {};

        // Perform the scan
        const devicesFound = await find();
        console.log(`Scan complete. Found ${devicesFound.length} devices on the network.`);

        const discovered = [];
        for (const device of devicesFound) {
            let existingDevice = await Device.findOne({ ipAddress: device.ip });

            // Perform SNMP classification if enabled
            let classification = { deviceType: 'Unknown', reason: 'Detection disabled' };
            if (detectTypes) {
                console.log(`Classifying ${device.ip}...`);
                classification = await identifyDeviceType(device.ip, device.mac, snmpCommunity);
            }

            if (existingDevice) {
                // Update last seen and hostname
                existingDevice.lastSeen = new Date();
                if (device.name && device.name !== '?') {
                    existingDevice.hostname = device.name;
                }

                // Update classification if we have a better one than 'Unknown', OR if existing is 'Unknown'
                // This prevents overwriting a manually set type unless it was just Unknown
                if (classification.deviceType !== 'Unknown' || existingDevice.deviceType === 'Unknown') {
                    existingDevice.deviceType = classification.deviceType;
                    existingDevice.detectionReason = classification.reason;
                    existingDevice.snmpDetails = classification.details;
                }

                await existingDevice.save();
                discovered.push(existingDevice);
            } else {
                // Create new device record
                const newNode = await Device.create({
                    ipAddress: device.ip,
                    hostname: (device.name && device.name !== '?') ? device.name : `Device-${device.ip.split('.').pop()}`,
                    deviceType: classification.deviceType,
                    detectionReason: classification.reason,
                    snmpDetails: classification.details,
                    status: 'HEALTHY',
                    lastSeen: new Date()
                });
                discovered.push(newNode);
            }
        }

        console.log(`Discovery complete. Processed ${discovered.length} devices.`);
        res.json({
            message: 'Discovery complete',
            totalFound: devicesFound.length,
            processedDevices: discovered
        });
    } catch (err) {
        console.error(`Discovery error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

// 2. Metrics API
router.get('/metrics/latest', async (req, res) => {
    console.log('GET /api/metrics/latest - Fetching latest metrics');
    try {
        // For simplicity, returning the latest metric for each device
        const devices = await Device.find();
        const latestMetrics = await Promise.all(devices.map(async (device) => {
            return await Metric.findOne({ deviceId: device._id }).sort({ timestamp: -1 });
        }));
        const data = latestMetrics.filter(m => m !== null);
        console.log(`Successfully fetched latest metrics for ${data.length} devices.`);
        res.json(data);
    } catch (err) {
        console.error(`Error fetching metrics: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

// 3. Network Health API
router.get('/network/health', async (req, res) => {
    console.log('GET /api/network/health - Calculating network health');
    try {
        const devices = await Device.find();
        const metrics = await Metric.find().sort({ timestamp: -1 });

        const healthy = devices.filter(d => d.status === 'HEALTHY').length;
        const warning = devices.filter(d => d.status === 'WARNING').length;
        const down = devices.filter(d => d.status === 'DOWN').length;

        let overallStatus = 'HEALTHY';
        if (down > 0) overallStatus = 'CRITICAL';
        else if (warning > 0) overallStatus = 'WARNING';

        console.log(`Health Status: ${overallStatus} (H: ${healthy}, W: ${warning}, D: ${down})`);
        res.json({
            overallStatus,
            healthyDevices: healthy,
            warningDevices: warning,
            downDevices: down
        });
    } catch (err) {
        console.error(`Error calculating health: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

// 4. Topology API
router.get('/topology', async (req, res) => {
    console.log('GET /api/topology - Fetching topology');
    try {
        const topology = await Topology.find();
        console.log(`Successfully fetched ${topology.length} topology links.`);
        res.json(topology);
    } catch (err) {
        console.error(`Error fetching topology: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

// 5. Alerts API
router.get('/alerts/active', async (req, res) => {
    console.log('GET /api/alerts/active - Fetching active alerts');
    try {
        const alerts = await Alert.find().populate('deviceId');
        console.log(`Successfully fetched ${alerts.length} active alerts.`);
        res.json(alerts);
    } catch (err) {
        console.error(`Error fetching alerts: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
