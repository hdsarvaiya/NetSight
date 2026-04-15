const axios = require('axios');
const { loadConfig } = require('../config');
const logger = require('./logger');

let client = null;

function getClient() {
    const config = loadConfig();
    if (!config.serverUrl || !config.agentKey) {
        return null;
    }

    client = axios.create({
        baseURL: config.serverUrl.replace(/\/$/, '') + '/api/v1/agent',
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
            'X-Agent-Key': config.agentKey,
        }
    });

    return client;
}

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

async function sendHeartbeat(data = {}) {
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

async function sendScanResults(devices) {
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

async function sendMetrics(metrics) {
    try {
        const api = getClient();
        if (!api) return null;
        const res = await api.post('/metrics', { metrics });
        return res.data;
    } catch (err) {
        logger.warn(`Failed to send metrics: ${err.message}`, 'monitor');
        return null;
    }
}

async function getDevices() {
    try {
        const api = getClient();
        if (!api) return [];
        const res = await api.get('/devices');
        return res.data.devices || [];
    } catch (err) {
        logger.warn(`Failed to fetch devices: ${err.message}`, 'monitor');
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
    sendHeartbeat,
    sendScanResults,
    sendMetrics,
    getDevices,
    getSettings,
};
