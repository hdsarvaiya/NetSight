const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');
const Topology = require('../models/Topology');

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

// Discovery API - Performs a real scan of the local network
router.post('/network/discover', async (req, res) => {
    console.log('POST /api/network/discover - Starting real network discovery');
    try {
        // Perform the scan
        const devicesFound = await find();
        console.log(`Scan complete. Found ${devicesFound.length} devices on the network.`);

        const discovered = [];
        for (const device of devicesFound) {
            // Check if device already exists by IP or MAC (if we had MAC in model)
            // Since our model only has ipAddress, we'll use that as the primary key for now
            let existingDevice = await Device.findOne({ ipAddress: device.ip });

            if (existingDevice) {
                // Update last seen and hostname if it changed
                existingDevice.lastSeen = new Date();
                if (device.name && device.name !== '?') {
                    existingDevice.hostname = device.name;
                }
                await existingDevice.save();
                discovered.push(existingDevice);
            } else {
                // Create new device record
                const newNode = await Device.create({
                    ipAddress: device.ip,
                    hostname: (device.name && device.name !== '?') ? device.name : `Device-${device.ip.split('.').pop()}`,
                    deviceType: 'Unknown', // We can't easily determine type from a basic scan
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
