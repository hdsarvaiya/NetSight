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
                status: scanner.isScanning() ? 'scanning' : (scannerRunning ? 'running' : 'stopped'),
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
        const config = saveConfig(req.body);
        logger.info('Settings saved', 'system');

        // If key/url changed, re-validate
        if (req.body.serverUrl && req.body.agentKey) {
            const result = await heartbeat.validateConnection();
            if (result) {
                res.json({ success: true, config, validated: true, agent: result.agent });
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

// Service controls
app.post('/api/start/:service', (req, res) => {
    const { service } = req.params;
    const config = loadConfig();

    switch (service) {
        case 'monitor':
            monitor.startMonitoring(config.pollInterval);
            break;
        case 'scanner':
            scannerRunning = true;
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
            scannerRunning = false;
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
    
    monitor.stopMonitoring();
    scanner.stopPeriodicScan();
    heartbeat.stopHeartbeat();
    scannerRunning = false;

    const config = loadConfig();

    if (!isConfigured()) {
        return res.json({ success: false, error: 'Agent not configured yet' });
    }

    // Validate first
    const validated = await heartbeat.validateConnection();
    if (!validated) {
        return res.json({ success: false, error: 'Could not connect to server' });
    }

    heartbeat.startHeartbeat();
    
    if (config.scanCidr) {
        scannerRunning = true;
        scanner.startPeriodicScan(config.scanCidr, config.scanInterval, async (devices) => {
            monitor.setDeviceList(devices);
            await serverApi.sendScanResults(devices);
        });
    }

    monitor.startMonitoring(config.pollInterval);

    res.json({ success: true, message: 'All services restarted' });
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

let scannerRunning = false;

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

    // Auto-start services if configured
    if (isConfigured() && config.autoStart) {
        logger.info('Auto-starting services...', 'system');
        
        const validated = await heartbeat.validateConnection();
        if (validated) {
            heartbeat.startHeartbeat();
            
            if (config.scanCidr) {
                scannerRunning = true;
                scanner.startPeriodicScan(config.scanCidr, config.scanInterval, async (devices) => {
                    monitor.setDeviceList(devices);
                    await serverApi.sendScanResults(devices);
                });
            }

            // Start monitor after a short delay to allow first scan to populate device list
            setTimeout(() => {
                monitor.startMonitoring(config.pollInterval);
            }, 5000);
        } else {
            logger.warn('Auto-start skipped — could not connect to server. Configure in Settings.', 'system');
        }
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
