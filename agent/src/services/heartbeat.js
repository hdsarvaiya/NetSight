const os = require('os');
const logger = require('./logger');
const serverApi = require('./serverApi');
const { loadConfig } = require('../config');

let heartbeatTimer = null;
let isConnected = false;
let agentInfo = null;
const startTime = Date.now();

async function sendHeartbeat() {
    const config = loadConfig();
    const localNets = Object.values(os.networkInterfaces())
        .flat()
        .filter(i => i.family === 'IPv4' && !i.internal);
    const localIp = localNets.length > 0 ? localNets[0].address : '0.0.0.0';

    const data = {
        hostname: os.hostname(),
        localIp,
        agentVersion: '1.0.0',
        scanCidr: config.scanCidr || '',
        stats: {
            uptime: Math.round((Date.now() - startTime) / 1000),
            platform: os.platform(),
            arch: os.arch(),
        }
    };

    const result = await serverApi.sendHeartbeat(data);
    
    if (result) {
        if (!isConnected) {
            isConnected = true;
            logger.success('Connected to NetSight server', 'heartbeat');
        }
    } else {
        if (isConnected) {
            isConnected = false;
            logger.error('Lost connection to NetSight server', 'heartbeat');
        }
    }
}

function startHeartbeat(interval = 30000) {
    if (heartbeatTimer) return;
    logger.info(`Heartbeat started (every ${interval / 1000}s)`, 'heartbeat');
    sendHeartbeat(); // Immediate first beat
    heartbeatTimer = setInterval(sendHeartbeat, interval);
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
        logger.info('Heartbeat stopped', 'heartbeat');
    }
}

async function validateConnection() {
    try {
        const result = await serverApi.validateAgent({
            hostname: os.hostname(),
            localIp: Object.values(os.networkInterfaces())
                .flat()
                .filter(i => i.family === 'IPv4' && !i.internal)[0]?.address || '0.0.0.0',
            agentVersion: '1.0.0',
        });
        
        if (result && result.success) {
            isConnected = true;
            agentInfo = result.agent;
            logger.success(`Validated! Organization: ${result.agent.organization}`, 'heartbeat');
            return result;
        }
        return null;
    } catch (err) {
        isConnected = false;
        logger.error(`Validation failed: ${err.message}`, 'heartbeat');
        return null;
    }
}

function getHeartbeatStatus() {
    return {
        isRunning: !!heartbeatTimer,
        isConnected,
        agentInfo,
        uptime: Math.round((Date.now() - startTime) / 1000),
    };
}

module.exports = {
    startHeartbeat,
    stopHeartbeat,
    validateConnection,
    getHeartbeatStatus,
    isRunning: () => !!heartbeatTimer,
    isConnected: () => isConnected,
};
