const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Device = require('./src/models/Device');
const Metric = require('./src/models/Metric');
const Alert = require('./src/models/Alert');
const Topology = require('./src/models/Topology');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const devicesData = [
    { ipAddress: '192.168.1.1', hostname: 'CoreRouter-01', deviceType: 'Router', status: 'HEALTHY' },
    { ipAddress: '192.168.1.2', hostname: 'AccessSwitch-01', deviceType: 'Switch', status: 'HEALTHY' },
    { ipAddress: '192.168.1.3', hostname: 'AccessSwitch-02', deviceType: 'Switch', status: 'WARNING' },
    { ipAddress: '192.168.1.10', hostname: 'MainServer', deviceType: 'Server', status: 'HEALTHY' },
    { ipAddress: '192.168.1.20', hostname: 'BackupServer', deviceType: 'Server', status: 'DOWN' },
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Device.deleteMany({});
        await Metric.deleteMany({});
        await Alert.deleteMany({});
        await Topology.deleteMany({});
        console.log('Cleared existing data.');

        // Insert Devices
        const createdDevices = await Device.insertMany(devicesData);
        console.log(`Inserted ${createdDevices.length} devices.`);

        // Insert Metrics for each device
        const metricsData = createdDevices.map(device => ({
            deviceId: device._id,
            latency: Math.floor(Math.random() * 50) + 5,
            packetLoss: device.status === 'DOWN' ? 100 : Math.floor(Math.random() * 5),
            isReachable: device.status !== 'DOWN',
        }));
        await Metric.insertMany(metricsData);
        console.log('Inserted metrics.');

        // Insert some Alerts
        const alertsData = [
            { deviceId: createdDevices[2]._id, severity: 'WARNING', message: 'High CPU usage detected' },
            { deviceId: createdDevices[4]._id, severity: 'CRITICAL', message: 'Device is completely unreachable' },
        ];
        await Alert.insertMany(alertsData);
        console.log('Inserted alerts.');

        // Insert Topology
        const topologyData = [
            { source: 'CoreRouter-01', target: 'AccessSwitch-01', type: 'wired' },
            { source: 'CoreRouter-01', target: 'AccessSwitch-02', type: 'wired' },
            { source: 'AccessSwitch-01', target: 'MainServer', type: 'wired' },
            { source: 'AccessSwitch-01', target: 'BackupServer', type: 'wired' },
        ];
        await Topology.insertMany(topologyData);
        console.log('Inserted topology links.');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedDB();
