const mongoose = require('mongoose');

const alertSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Device'
    },
    deviceName: String,
    deviceIp: String,
    severity: {
        type: String,
        enum: ['critical', 'warning', 'info'],
        default: 'warning'
    },
    message: {
        type: String,
        required: true
    },
    acknowledged: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

alertSchema.index({ user: 1, createdAt: -1 });
// Auto-delete alerts older than 7 days
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Alert', alertSchema);
