const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    ip: {
        type: String,
        required: [true, 'Please add an IP address']
    },
    mac: {
        type: String,
        required: [true, 'Please add a MAC address']
    },
    type: {
        type: String,
        enum: ['Router', 'Switch', 'Server', 'Workstation', 'Access Point', 'Printer', 'Firewall', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Online'
    },
    name: { type: String, default: '' },
    hostname: { type: String, default: '' },
    vendor: { type: String, default: 'Unknown' },
    model: { type: String, default: '' },
    osVersion: { type: String, default: '' },
    location: { type: String, default: '' },

    // Real-time metrics (updated every poll)
    latency: { type: Number, default: 0 },
    packetLoss: { type: Number, default: 0 },
    cpuUsage: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    trafficIn: { type: Number, default: 0 },
    trafficOut: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now },

    openPorts: [{
        port: Number,
        service: String
    }],
    isGateway: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

deviceSchema.index({ user: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
