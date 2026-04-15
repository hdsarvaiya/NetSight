const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Settings = require('../models/settingsModel');
const Agent = require('../models/agentModel');
const { logActivity } = require('./auditController');

// @desc    Get user settings
// @route   GET /api/v1/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({ user: req.user.id });

    // If settings don't exist for the user yet, create defaults
    if (!settings) {
        settings = await Settings.create({ user: req.user.id });
    }

    res.status(200).json(settings);
});

// @desc    Update user settings
// @route   PUT /api/v1/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({ user: req.user.id });

    if (!settings) {
        settings = await Settings.create({ user: req.user.id, ...req.body });
    } else {
        settings = await Settings.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
    }

    // Log the activity
    await logActivity({
        req,
        action: 'Update Settings',
        target: 'System Settings',
        result: 'Success',
        organization: req.user.organization
    });

    res.status(200).json(settings);
});

// ═══════════════════════════════════════════
// AGENT KEY MANAGEMENT
// ═══════════════════════════════════════════

// @desc    Generate a new agent key
// @route   POST /api/v1/settings/agent-key
// @access  Private
const generateAgentKey = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const organization = req.user.organization;

    // Generate a secure random key
    const rawKey = 'ns_ak_' + crypto.randomBytes(32).toString('hex');

    // Hash the key for storage (like a password)
    const salt = await bcrypt.genSalt(10);
    const hashedKey = await bcrypt.hash(rawKey, salt);

    // Create agent record
    const agent = await Agent.create({
        organization,
        agentKey: hashedKey,
        name: name || 'NetSight Agent',
    });

    // Log the activity
    await logActivity({
        req,
        action: 'Generate Agent Key',
        target: agent.name,
        result: 'Success',
        organization
    });

    // Return the raw key ONCE — it cannot be retrieved again
    res.status(201).json({
        success: true,
        message: 'Agent key generated. Save this key — it will not be shown again.',
        agentId: agent._id,
        agentKey: rawKey,
        name: agent.name,
    });
});

// @desc    Revoke (delete) an agent key
// @route   DELETE /api/v1/settings/agent-key/:id
// @access  Private
const revokeAgentKey = asyncHandler(async (req, res) => {
    const agent = await Agent.findOne({
        _id: req.params.id,
        organization: req.user.organization
    });

    if (!agent) {
        res.status(404);
        throw new Error('Agent not found');
    }

    await Agent.deleteOne({ _id: agent._id });

    // Log the activity
    await logActivity({
        req,
        action: 'Revoke Agent Key',
        target: agent.name,
        result: 'Success',
        organization: req.user.organization
    });

    res.json({ success: true, message: 'Agent key revoked successfully' });
});

// @desc    Get all agents for this organization
// @route   GET /api/v1/settings/agents
// @access  Private
const getAgents = asyncHandler(async (req, res) => {
    const agents = await Agent.find(
        { organization: req.user.organization },
        '-agentKey' // Exclude the hashed key from response
    ).sort({ createdAt: -1 });

    // Mark agents as offline if not seen in 60 seconds
    const cutoff = new Date(Date.now() - 60000);
    const agentsData = agents.map(a => {
        const isOnline = a.lastSeen && a.lastSeen >= cutoff;
        return {
            _id: a._id,
            name: a.name,
            status: isOnline ? 'Online' : 'Offline',
            lastSeen: a.lastSeen,
            hostname: a.hostname,
            localIp: a.localIp,
            scanCidr: a.scanCidr,
            agentVersion: a.agentVersion,
            createdAt: a.createdAt,
        };
    });

    res.json({ success: true, agents: agentsData });
});

// @desc    Download the NetSight Agent Windows executable
// @route   GET /api/v1/settings/download-agent
// @access  Private
const downloadAgent = asyncHandler(async (req, res) => {
    const path = require('path');
    const fs = require('fs');

    // Path to the generated agent .exe
    const agentPath = path.resolve(__dirname, '../../agent/dist/netsight-agent.exe');

    if (!fs.existsSync(agentPath)) {
        res.status(404);
        throw new Error('Agent executable not found. Please contact support.');
    }

    res.download(agentPath, 'NetSight-Agent.exe', (err) => {
        if (err) {
            console.error('[DOWNLOAD] Error sending agent:', err);
        }
    });
});

module.exports = {
    getSettings,
    updateSettings,
    generateAgentKey,
    revokeAgentKey,
    getAgents,
    downloadAgent,
};
