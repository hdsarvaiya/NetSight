const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    latencyThreshold: { type: Number, default: 50 },
    packetLossThreshold: { type: Number, default: 1 },
    cpuThreshold: { type: Number, default: 80 },
    memoryThreshold: { type: Number, default: 85 },
    diskThreshold: { type: Number, default: 20 },
    
    quickScanInterval: { type: Number, default: 5 },
    fullScanInterval: { type: Number, default: 60 },
    healthCheckInterval: { type: Number, default: 10 },
    
    emailNotifications: { type: Boolean, default: true },
    slackNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    criticalAlertsOnly: { type: Boolean, default: false },
    
    sessionTimeout: { type: Number, default: 30 },
    mfaEnabled: { type: Boolean, default: true },
    ipWhitelisting: { type: Boolean, default: false },
    auditLogging: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
