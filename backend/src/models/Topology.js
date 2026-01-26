const mongoose = require('mongoose');

const topologySchema = new mongoose.Schema({
    source: { type: String, required: true }, // Hostname or ID
    target: { type: String, required: true }, // Hostname or ID
    type: { type: String, default: 'wired' }
});

module.exports = mongoose.model('Topology', topologySchema);
