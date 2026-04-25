const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const Agent = require('../models/agentModel');
const liveState = require('./liveState');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT"]
            },
            // Tuned for reliability on constrained networks
            pingTimeout: 30000,
            pingInterval: 15000,
        });

        // ─── Agent namespace ───
        const agentNs = io.of('/agent');

        agentNs.use(async (socket, next) => {
            // Authenticate agent by key
            const agentKey = socket.handshake.auth?.agentKey;
            if (!agentKey) return next(new Error('Missing agent key'));

            try {
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

                if (!matchedAgent) return next(new Error('Invalid agent key'));

                socket.agentDoc = matchedAgent;
                socket.organization = matchedAgent.organization;
                next();
            } catch (err) {
                next(new Error('Auth failed'));
            }
        });

        agentNs.on('connection', (socket) => {
            const org = socket.organization;
            console.log(`[WS] Agent connected (org: ${org})`);

            // Update agent status
            socket.agentDoc.status = 'Online';
            socket.agentDoc.lastSeen = new Date();
            socket.agentDoc.save().catch(() => {});

            // ── Agent sends metrics ──
            socket.on('agent:metrics', (data) => {
                const { metrics } = data;
                if (!metrics || !Array.isArray(metrics)) return;

                // Update in-memory state
                liveState.updateFromMetrics(metrics, org);

                // Relay to all frontend clients in this org's room
                const snapshot = liveState.getSnapshot(org);
                io.to(`org:${org}`).emit('live:metrics', {
                    devices: snapshot.devices,
                    stats: snapshot.stats,
                    timestamp: Date.now(),
                });
            });

            // ── Agent sends scan results ──
            socket.on('agent:scan', (data) => {
                const { devices } = data;
                if (!devices || !Array.isArray(devices)) return;

                // Update in-memory
                liveState.updateFromScan(devices, org);

                // Relay to frontend
                const snapshot = liveState.getSnapshot(org);
                io.to(`org:${org}`).emit('live:devices', {
                    devices: snapshot.devices,
                    stats: snapshot.stats,
                    timestamp: Date.now(),
                });
            });

            // ── Agent heartbeat ──
            socket.on('agent:heartbeat', (data) => {
                socket.agentDoc.lastSeen = new Date();
                socket.agentDoc.status = 'Online';
                if (data.hostname) socket.agentDoc.hostname = data.hostname;
                if (data.localIp) socket.agentDoc.localIp = data.localIp;
                socket.agentDoc.save().catch(() => {});

                io.to(`org:${org}`).emit('live:agent-status', {
                    status: 'Online',
                    lastSeen: new Date(),
                    hostname: data.hostname,
                    stats: data.stats,
                });
            });

            socket.on('disconnect', () => {
                console.log(`[WS] Agent disconnected (org: ${org})`);
                socket.agentDoc.status = 'Offline';
                socket.agentDoc.save().catch(() => {});

                io.to(`org:${org}`).emit('live:agent-status', {
                    status: 'Offline',
                    lastSeen: new Date(),
                });
            });
        });

        // ─── Frontend connections (default namespace) ───
        io.on('connection', (socket) => {
            // Frontend joins its org room for targeted broadcasts
            socket.on('join:org', (organization) => {
                if (organization) {
                    socket.join(`org:${organization}`);

                    // Send current live snapshot immediately
                    const snapshot = liveState.getSnapshot(organization);
                    if (snapshot.devices.length > 0) {
                        socket.emit('live:metrics', {
                            devices: snapshot.devices,
                            stats: snapshot.stats,
                            timestamp: Date.now(),
                        });
                    }
                }
            });

            socket.on('disconnect', () => {
                // Cleanup handled automatically by Socket.io rooms
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            console.warn("Socket.io not initialized. Cannot broadcast event.");
            return null;
        }
        return io;
    }
};
