const mongoose = require('mongoose');

const deviceMetricSchema = mongoose.Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Device'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Online'
    },
    latency: { type: Number, default: 0 },       // ms
    packetLoss: { type: Number, default: 0 },     // %
    cpuUsage: { type: Number, default: 0 },       // %
    memoryUsage: { type: Number, default: 0 },    // %
    trafficIn: { type: Number, default: 0 },      // bytes
    trafficOut: { type: Number, default: 0 },     // bytes
});

// TTL index: auto-delete metrics older than 90 days to save space
deviceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
deviceMetricSchema.index({ device: 1, timestamp: -1 });
deviceMetricSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('DeviceMetric', deviceMetricSchema);
