const axios = require('axios');
const { io: ioClient } = require('socket.io-client');
const { loadConfig } = require('../config');
const logger = require('./logger');

let client = null;
let socket = null;
let socketConnected = false;

function getClient() {
    const config = loadConfig();
    if (!config.serverUrl || !config.agentKey) {
        return null;
    }

    client = axios.create({
        baseURL: config.serverUrl.replace(/\/$/, '') + '/api/v1/agent',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'X-Agent-Key': config.agentKey,
        }
    });

    return client;
}

// ─── WebSocket Connection ───
function connectSocket() {
    const config = loadConfig();
    if (!config.serverUrl || !config.agentKey) return null;

    const serverUrl = config.serverUrl.replace(/\/$/, '');

    socket = ioClient(`${serverUrl}/agent`, {
        auth: { agentKey: config.agentKey },
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: Infinity,
        timeout: 10000,
    });

    socket.on('connect', () => {
        socketConnected = true;
        logger.success('WebSocket connected to server', 'system');
    });

    socket.on('disconnect', (reason) => {
        socketConnected = false;
        if (reason !== 'io client disconnect') {
            logger.warn('WebSocket disconnected, will reconnect...', 'system');
        }
    });

    socket.on('connect_error', (err) => {
        // Only log once, not every retry
        if (socketConnected) {
            logger.warn(`WebSocket error: ${err.message}`, 'system');
            socketConnected = false;
        }
    });

    return socket;
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        socketConnected = false;
    }
}

function isSocketConnected() {
    return socketConnected && socket?.connected;
}

// ─── Emit metrics via WebSocket (primary) or HTTP (fallback) ───
let metricsSendFailing = false;

async function emitMetrics(metrics) {
    // Try WebSocket first (instant, no timeout issues)
    if (isSocketConnected()) {
        socket.emit('agent:metrics', { metrics });
        if (metricsSendFailing) {
            logger.success('Metrics delivery restored (WebSocket)', 'monitor');
            metricsSendFailing = false;
        }
        return true;
    }

    // Fallback to HTTP if WebSocket not connected
    try {
        const api = getClient();
        if (!api) return null;
        const res = await api.post('/metrics', { metrics });
        if (metricsSendFailing) {
            logger.success('Metrics delivery restored (HTTP)', 'monitor');
            metricsSendFailing = false;
        }
        return res.data;
    } catch (err) {
        if (!metricsSendFailing) {
            logger.warn(`Failed to send metrics: ${err.message}`, 'monitor');
            metricsSendFailing = true;
        }
        return null;
    }
}

// ─── Emit scan results via WebSocket + HTTP ───
async function emitScanResults(devices) {
    // Send via WebSocket for real-time
    if (isSocketConnected()) {
        socket.emit('agent:scan', { devices });
    }

    // Also send via HTTP to persist to DB (scan results are infrequent)
    try {
        const api = getClient();
        if (!api) return null;
        const res = await api.post('/scan-results', { devices });
        return res.data;
    } catch (err) {
        logger.error(`Failed to send scan results: ${err.message}`, 'scanner');
        return null;
    }
}

// ─── Emit heartbeat via WebSocket + HTTP ───
async function emitHeartbeat(data = {}) {
    // Send via WebSocket for real-time
    if (isSocketConnected()) {
        socket.emit('agent:heartbeat', data);
    }

    // Also send via HTTP (agent needs the response for validation)
    try {
        const api = getClient();
        if (!api) return null;
        const res = await api.post('/heartbeat', data);
        return res.data;
    } catch (err) {
        logger.warn(`Heartbeat failed: ${err.message}`, 'heartbeat');
        return null;
    }
}

// ─── HTTP-only functions (need response data) ───
async function validateAgent(info = {}) {
    try {
        const api = getClient();
        if (!api) throw new Error('Agent not configured');
        const res = await api.post('/validate', info);
        return res.data;
    } catch (err) {
        const msg = err.response?.data?.message || err.message;
        throw new Error(msg);
    }
}

async function getDevices() {
    try {
        const api = getClient();
        if (!api) return [];
        const res = await api.get('/devices');
        return res.data.devices || [];
    } catch (err) {
        logger.warn(`Failed to fetch devices: ${err.message || err.code || 'network error'}`, 'monitor');
        return [];
    }
}

async function getSettings() {
    try {
        const api = getClient();
        if (!api) return null;
        const res = await api.get('/settings');
        return res.data.settings || null;
    } catch (err) {
        logger.warn(`Failed to fetch settings: ${err.message}`, 'system');
        return null;
    }
}

module.exports = {
    validateAgent,
    sendHeartbeat: emitHeartbeat,
    sendScanResults: emitScanResults,
    sendMetrics: emitMetrics,
    getDevices,
    getSettings,
    connectSocket,
    disconnectSocket,
    isSocketConnected,
};
