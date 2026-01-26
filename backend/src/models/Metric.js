const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    latency: { type: Number, required: true },
    packetLoss: { type: Number, required: true },
    isReachable: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Metric', metricSchema);
