const fs = require('fs');
const path = require('path');

const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..');
const CONFIG_PATH = path.join(basePath, 'agent.config.json');

const DEFAULTS = {
    serverUrl: '',
    agentKey: '',
    agentName: 'NetSight Agent',
    scanCidr: '',
    pollInterval: 5000,
    scanInterval: 300000,
    uiPort: 9090,
    autoStart: false,
    verboseLogging: false,
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const saved = JSON.parse(raw);
            return { ...DEFAULTS, ...saved };
        }
    } catch (e) {
        console.error('[CONFIG] Error reading config:', e.message);
    }
    return { ...DEFAULTS };
}

function saveConfig(config) {
    try {
        const merged = { ...DEFAULTS, ...config };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
        return merged;
    } catch (e) {
        console.error('[CONFIG] Error saving config:', e.message);
        throw e;
    }
}

function isConfigured() {
    const config = loadConfig();
    return !!(config.serverUrl && config.agentKey);
}

module.exports = { loadConfig, saveConfig, isConfigured, CONFIG_PATH };
