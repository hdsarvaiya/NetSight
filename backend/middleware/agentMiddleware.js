const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const Agent = require('../models/agentModel');

/**
 * Middleware to authenticate agent requests via X-Agent-Key header.
 * This is separate from user JWT auth — it's machine-to-machine authentication.
 */
const protectAgent = asyncHandler(async (req, res, next) => {
    const agentKey = req.headers['x-agent-key'];

    if (!agentKey) {
        res.status(401);
        throw new Error('No agent key provided');
    }

    // Find all agents and compare keys (bcrypt hashes can't be queried directly)
    const agents = await Agent.find({});
    
    let matchedAgent = null;
    for (const agent of agents) {
        const isMatch = await bcrypt.compare(agentKey, agent.agentKey);
        if (isMatch) {
            matchedAgent = agent;
            break;
        }
    }

    if (!matchedAgent) {
        res.status(401);
        throw new Error('Invalid agent key');
    }

    // Attach agent info to request
    req.agent = matchedAgent;
    req.organization = matchedAgent.organization;
    req.agentId = matchedAgent._id;

    // Update lastSeen to prevent backend from taking over during WebSocket disconnects
    matchedAgent.lastSeen = new Date();
    await matchedAgent.save().catch(() => {});

    next();
});

module.exports = { protectAgent };
