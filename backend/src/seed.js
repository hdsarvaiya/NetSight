const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Device = require('./models/Device');
const Metric = require('./models/Metric');
const Alert = require('./models/Alert');
const Topology = require('./models/Topology');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Device.deleteMany({});
        await Metric.deleteMany({});
        await Alert.deleteMany({});
        await Topology.deleteMany({});

        // 1. Seed Device
        const device1 = await Device.create({
            ipAddress: '192.168.1.1',
            hostname: 'Main Router',
            deviceType: 'router',
            status: 'DOWN',
            lastSeen: '2026-01-25T10:10:00Z'
        });

        const device2 = await Device.create({
            ipAddress: '192.168.1.10',
            hostname: 'Office Switch',
            deviceType: 'switch',
            status: 'WARNING',
            lastSeen: new Date()
        });

        // 2. Seed Metrics
        await Metric.create({
            deviceId: device1._id,
            latency: 320,
            packetLoss: 45,
            isReachable: false,
            timestamp: '2026-01-25T10:12:00Z'
        });

        // 3. Seed Topology
        await Topology.create({
            source: 'Main Router',
            target: 'Office Switch',
            type: 'wired'
        });

        // 4. Seed Alerts
        await Alert.create({
            deviceId: device1._id,
            severity: 'CRITICAL',
            message: 'Device unreachable for 3 minutes',
            timestamp: new Date()
        });

        console.log('Seed data successfully inserted');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
