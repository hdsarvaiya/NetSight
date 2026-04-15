const mongoose = require('mongoose');

const agentSchema = mongoose.Schema({
    organization: {
        type: String,
        required: [true, 'Organization is required']
    },
    agentKey: {
        type: String,
        required: [true, 'Agent key hash is required']
    },
    name: {
        type: String,
        default: 'NetSight Agent'
    },
    status: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Offline'
    },
    lastSeen: {
        type: Date,
        default: null
    },
    agentVersion: {
        type: String,
        default: '1.0.0'
    },
    hostname: {
        type: String,
        default: ''
    },
    localIp: {
        type: String,
        default: ''
    },
    scanCidr: {
        type: String,
        default: ''
    },
    pollInterval: {
        type: Number,
        default: 5000
    },
    scanInterval: {
        type: Number,
        default: 300000
    }
}, {
    timestamps: true
});

agentSchema.index({ organization: 1 });

module.exports = mongoose.model('Agent', agentSchema);
