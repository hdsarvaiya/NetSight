const mongoose = require('mongoose');

const alertSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    organization: {
        type: String,
        required: [true, 'Please add an organization']
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Device'
    },
    deviceName: String,
    deviceIp: String,
    alert_type: {
        type: String,
        enum: ['PERFORMANCE', 'SECURITY', 'AVAILABILITY'],
        default: 'PERFORMANCE'
    },
    metric: String,
    metric_value: mongoose.Schema.Types.Mixed,
    threshold_value: mongoose.Schema.Types.Mixed,
    severity: {
        type: String,
        enum: ['critical', 'warning', 'info'],
        default: 'warning'
    },
    status: {
        type: String,
        enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'],
        default: 'NEW'
    },
    message: {
        type: String,
        required: true
    },
    duplicate_count: {
        type: Number,
        default: 0
    },
    resolvedAt: Date,
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Backwards compatibility for older frontend calls
    acknowledged: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Middleware to sync older `acknowledged` flag with the new `status` enum
alertSchema.pre('save', function(next) {
    // If status is missing, initialize it from acknowledged flag
    if (!this.status) {
        this.status = this.acknowledged ? 'ACKNOWLEDGED' : 'NEW';
    }

    if (this.isModified('status')) {
        if (this.status === 'ACKNOWLEDGED' || this.status === 'RESOLVED' || this.status === 'CLOSED') {
            this.acknowledged = true;
        } else {
            this.acknowledged = false;
        }
    } else if (this.isModified('acknowledged')) {
        if (this.acknowledged && (this.status === 'NEW' || !this.status)) {
            this.status = 'ACKNOWLEDGED';
        } else if (!this.acknowledged) {
            this.status = 'NEW';
        }
    }
    next();
});

alertSchema.index({ organization: 1, createdAt: -1 });
alertSchema.index({ organization: 1, status: 1, severity: 1, createdAt: -1 });
// Auto-delete alerts older than 7 days
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Alert', alertSchema);
