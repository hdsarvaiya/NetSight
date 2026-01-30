const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    ipAddress: { type: String, required: true },
    hostname: { type: String, required: true },
    deviceType: { type: String, required: true },
    status: { type: String, enum: ['UP', 'DOWN', 'WARNING', 'CRITICAL', 'HEALTHY'], default: 'HEALTHY' },
    lastSeen: { type: Date, default: Date.now },
    detectionReason: { type: String },
    snmpDetails: { type: Object }
});

module.exports = mongoose.model('Device', deviceSchema);
