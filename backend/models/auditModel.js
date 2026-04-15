const mongoose = require('mongoose');

const auditSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    target: {
        type: String,
        required: true
    },
    result: {
        type: String,
        enum: ['Success', 'Failed'],
        default: 'Success'
    },
    ip: {
        type: String
    }
}, {
    timestamps: true
});

// Index for organization-based filtering and sorting
auditSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);
