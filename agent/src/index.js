const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const { loadConfig, saveConfig, isConfigured } = require('./config');
const logger = require('./services/logger');
const scanner = require('./services/scanner');
const monitor = require('./services/monitor');
const heartbeat = require('./services/heartbeat');
const serverApi = require('./services/serverApi');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Serve static UI files
app.use(express.static(path.join(__dirname, '..', 'ui')));

// ─── Stream logs to connected browsers via Socket.IO ───
io.on('connection', (socket) => {
    // Send existing log buffer on connect
    socket.emit('log_history', logger.getEntries(200));
    
    // Stream new logs
    const onLog = (entry) => socket.emit('log', entry);
    logger.on('log', onLog);
    socket.on('disconnect', () => logger.removeListener('log', onLog));
});

// ═══════════════════════════════════════════
// SERVICE LIFECYCLE — Centralized Helpers
// ═══════════════════════════════════════════

let servicesRunning = false;

/**
 * Stop all services cleanly.
 */
function stopAllServices() {
    monitor.stopMonitoring();
    scanner.stopPeriodicScan();
    heartbeat.stopHeartbeat();
    serverApi.disconnectSocket();
    servicesRunning = false;
}

/**
 * Start all services in the correct order:
 *   1. Validate connection
 *   2. Start heartbeat
 *   3. Run first network scan
 *   4. Start monitor (after devices are available)
 *   5. Start periodic scanning
 * 
 * Returns { success, error? }
 */
async function startAllServices() {
    const config = loadConfig();

    if (!isConfigured()) {
        return { success: false, error: 'Agent not configured yet' };
    }

    // Stop anything currently running first
    stopAllServices();

    // Step 1: Validate connection to server
    const validated = await heartbeat.validateConnection();
    if (!validated) {
        return { success: false, error: 'Could not connect to server' };
    }

    // Step 2: Connect WebSocket for real-time metrics relay
    serverApi.connectSocket();

    // Step 3: Start heartbeat (keeps connection alive)
    heartbeat.startHeartbeat();
    servicesRunning = true;

    // Step 3: Run initial scan + start periodic scanning
    if (config.scanCidr) {
        const onScanComplete = async (devices) => {
            monitor.setDeviceList(devices);

            // Merge latest monitor metrics into scan results so backend gets latency data
            const latestMetrics = monitor.getLatestMetrics();
            const metricsMap = {};
            latestMetrics.forEach(m => { metricsMap[m.ip] = m; });

            const enrichedDevices = devices.map(d => {
                const m = metricsMap[d.ip];
                if (m) {
                    return {
                        ...d,
                        status: m.status,
                        latency: m.latency,
                        packetLoss: m.packetLoss,
                        cpuUsage: m.cpuUsage,
                        memoryUsage: m.memoryUsage,
                        trafficIn: m.trafficIn,
                        trafficOut: m.trafficOut,
                    };
                }
                return d;
            });

            await serverApi.sendScanResults(enrichedDevices);

            // Start monitor after the FIRST scan populates devices
            if (!monitor.isRunning()) {
                monitor.startMonitoring(config.pollInterval);
            }
        };

        scanner.startPeriodicScan(config.scanCidr, config.scanInterval, onScanComplete);
    } else {
        // No CIDR configured — start monitor anyway (it will fetch from server)
        monitor.startMonitoring(config.pollInterval);
    }

    return { success: true };
}

// ═══════════════════════════════════════════
// LOCAL API ROUTES (for the web UI at localhost:9090)
// ═══════════════════════════════════════════

// Get overall agent status
app.get('/api/status', (req, res) => {
    const config = loadConfig();
    const hbStatus = heartbeat.getHeartbeatStatus();
    
    res.json({
        configured: isConfigured(),
        connected: heartbeat.isConnected(),
        agentInfo: hbStatus.agentInfo,
        services: {
            monitor: {
                status: monitor.isRunning() ? 'running' : 'stopped',
                ...monitor.getMonitorStatus(),
            },
            scanner: {
                status: scanner.isScanning() ? 'scanning' : (servicesRunning ? 'running' : 'stopped'),
                ...scanner.getScanStatus(),
            },
            heartbeat: {
                status: heartbeat.isRunning() ? 'running' : 'stopped',
                ...heartbeat.getHeartbeatStatus(),
            },
        },
        config: {
            serverUrl: config.serverUrl,
            agentName: config.agentName,
            scanCidr: config.scanCidr,
            pollInterval: config.pollInterval,
            scanInterval: config.scanInterval,
        },
        uptime: hbStatus.uptime,
    });
});

// Get/save settings
app.get('/api/settings', (req, res) => {
    const config = loadConfig();
    res.json({ success: true, config });
});

app.post('/api/settings', async (req, res) => {
    try {
        // Save the config first
        const config = saveConfig(req.body);
        logger.info('Settings saved', 'system');

        // If key/url provided, validate connection
        if (req.body.serverUrl && req.body.agentKey) {
            const result = await heartbeat.validateConnection();
            if (result) {
                // Validation succeeded — enable autoStart for future boots
                saveConfig({ ...config, autoStart: true });

                // Auto-start all services with the new config
                logger.info('Restarting all services...', 'system');
                const startResult = await startAllServices();

                if (startResult.success) {
                    res.json({ success: true, config, validated: true, agent: result.agent, servicesStarted: true });
                } else {
                    res.json({ success: true, config, validated: true, agent: result.agent, servicesStarted: false, startError: startResult.error });
                }
            } else {
                res.json({ success: true, config, validated: false, error: 'Could not validate with server' });
            }
        } else {
            res.json({ success: true, config });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Service controls (individual)
app.post('/api/start/:service', (req, res) => {
    const { service } = req.params;
    const config = loadConfig();

    switch (service) {
        case 'monitor':
            monitor.startMonitoring(config.pollInterval);
            break;
        case 'scanner':
            scanner.startPeriodicScan(config.scanCidr, config.scanInterval, async (devices) => {
                monitor.setDeviceList(devices);
                await serverApi.sendScanResults(devices);
            });
            break;
        case 'heartbeat':
            heartbeat.startHeartbeat();
            break;
        default:
            return res.status(400).json({ error: 'Unknown service' });
    }
    
    logger.info(`Service "${service}" started`, 'system');
    res.json({ success: true, service, status: 'running' });
});

app.post('/api/stop/:service', (req, res) => {
    const { service } = req.params;
    
    switch (service) {
        case 'monitor':
            monitor.stopMonitoring();
            break;
        case 'scanner':
            scanner.stopPeriodicScan();
            break;
        case 'heartbeat':
            heartbeat.stopHeartbeat();
            break;
        default:
            return res.status(400).json({ error: 'Unknown service' });
    }
    
    logger.info(`Service "${service}" stopped`, 'system');
    res.json({ success: true, service, status: 'stopped' });
});

// Trigger immediate scan
app.post('/api/scan-now', async (req, res) => {
    const config = loadConfig();
    if (!config.scanCidr) {
        return res.status(400).json({ error: 'No CIDR configured. Set it in Settings.' });
    }
    
    // Scan in background
    res.json({ success: true, message: 'Scan started' });
    
    const devices = await scanner.scanNetwork(config.scanCidr);
    if (devices) {
        monitor.setDeviceList(devices);
        await serverApi.sendScanResults(devices);
        io.emit('scan_complete', { count: devices.length });
    }
});

// Get logs
app.get('/api/logs', (req, res) => {
    const count = parseInt(req.query.count) || 200;
    res.json({ success: true, logs: logger.getEntries(count) });
});

// Restart all services
app.post('/api/restart-all', async (req, res) => {
    logger.info('Restarting all services...', 'system');

    const result = await startAllServices();

    if (result.success) {
        res.json({ success: true, message: 'All services restarted' });
    } else {
        res.json({ success: false, error: result.error });
    }
});

// Auto-detect network interfaces
app.get('/api/interfaces', (req, res) => {
    const interfaces = scanner.getLocalNetworkInfo();
    const virtualPatterns = /hyper-v|vethernet|docker|vmnet|virtualbox|vbox|wsl|loopback/i;
    
    const result = interfaces.map(iface => {
        const isVirtual = virtualPatterns.test(iface.name);
        const parts = iface.ip.split('.');
        const subnetBase = parts.slice(0, 3).join('.') + '.0';
        const cidr = `${subnetBase}/24`;
        return { name: iface.name, ip: iface.ip, cidr, isVirtual };
    }).filter(i => !i.isVirtual);

    res.json({ success: true, interfaces: result });
});

// ═══════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════

const config = loadConfig();
const PORT = config.uiPort || 9090;

server.listen(PORT, async () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║       NetSight Agent v1.0.0              ║');
    console.log(`  ║  Control Panel: http://localhost:${PORT}    ║`);
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');

    logger.info(`Agent UI running on http://localhost:${PORT}`, 'system');

    // Auto-start services ONLY if previously configured and autoStart is enabled
    if (isConfigured() && config.autoStart) {
        logger.info('Auto-starting services...', 'system');
        const result = await startAllServices();
        if (!result.success) {
            logger.warn(`Auto-start failed — ${result.error}. Open Settings to reconfigure.`, 'system');
        }
    } else if (isConfigured() && !config.autoStart) {
        logger.info('Agent configured but auto-start is disabled. Click "Restart All" or save settings to start.', 'system');
    } else {
        logger.info('Agent not configured yet. Open the control panel to set up.', 'system');
    }

    // Try to open browser on first run
    if (!isConfigured()) {
        try {
            const open = require('open');
            await open(`http://localhost:${PORT}`);
        } catch (e) { /* ignore if open fails */ }
    }
});
