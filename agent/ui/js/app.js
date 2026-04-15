// ═══════════════════════════════════════════
// NetSight Agent — Control Panel Frontend
// ═══════════════════════════════════════════

const socket = io();
let statusRefreshTimer = null;

// ─── Socket.IO: Real-time log streaming ───
socket.on('log', (entry) => {
    appendLog(entry);
});

socket.on('log_history', (entries) => {
    const container = document.getElementById('logContainer');
    container.innerHTML = '';
    entries.forEach(entry => appendLog(entry));
});

socket.on('scan_complete', (data) => {
    showNotification(`Scan complete: ${data.count} devices found`);
});

// ─── Log Management ───
function appendLog(entry) {
    const container = document.getElementById('logContainer');
    const emptyMsg = container.querySelector('.log-empty');
    if (emptyMsg) emptyMsg.remove();

    const div = document.createElement('div');
    div.className = `log-entry ${entry.level}`;
    
    const prefix = entry.level === 'error' ? '✗' : entry.level === 'warn' ? '⚠' : entry.level === 'success' ? '✓' : '›';
    
    div.innerHTML = `
        <span class="log-time">${entry.time}</span>
        <span class="log-source">[${entry.source}]</span>
        <span class="log-message">${prefix} ${escapeHtml(entry.message)}</span>
    `;
    container.appendChild(div);

    // Auto-scroll
    if (document.getElementById('autoScroll').checked) {
        container.scrollTop = container.scrollHeight;
    }

    // Limit DOM nodes (keep last 300)
    while (container.children.length > 300) {
        container.removeChild(container.firstChild);
    }
}

function clearLogs() {
    const container = document.getElementById('logContainer');
    container.innerHTML = '<div class="log-empty">Logs cleared</div>';
}

function copyLogs() {
    const container = document.getElementById('logContainer');
    const entries = container.querySelectorAll('.log-entry');
    const text = Array.from(entries).map(e => {
        const time = e.querySelector('.log-time').textContent;
        const source = e.querySelector('.log-source').textContent;
        const msg = e.querySelector('.log-message').textContent;
        return `${time} ${source} ${msg}`;
    }).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Logs copied to clipboard!');
    });
}

// ─── Status Refresh ───
async function refreshStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        updateUI(data);
    } catch (err) {
        updateConnectionStatus(false);
    }
}

function updateUI(data) {
    // Connection status
    updateConnectionStatus(data.connected);

    // Info bar
    document.getElementById('serverUrl').textContent = data.config?.serverUrl || 'Not configured';
    document.getElementById('orgName').textContent = data.agentInfo?.organization || '—';
    document.getElementById('agentName').textContent = data.config?.agentName || '—';

    // Services
    updateServiceRow('monitor', data.services.monitor);
    updateServiceRow('scanner', data.services.scanner);
    updateServiceRow('heartbeat', data.services.heartbeat);

    // Stats
    document.getElementById('statDevices').textContent = data.services.monitor.deviceCount || data.services.scanner.devicesFound || 0;
    document.getElementById('statMetrics').textContent = formatNumber(data.services.monitor.metricsSent || 0);
    document.getElementById('statPolls').textContent = formatNumber(data.services.monitor.pollCount || 0);
    document.getElementById('statUptime').textContent = formatUptime(data.uptime || 0);
}

function updateConnectionStatus(connected) {
    const el = document.getElementById('connectionStatus');
    const dot = el.querySelector('.status-dot');
    const text = el.querySelector('.status-text');
    
    if (connected) {
        dot.className = 'status-dot online';
        text.textContent = 'Connected';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'Not Connected';
    }
}

function updateServiceRow(service, data) {
    const statusEl = document.getElementById(`${service}Status`);
    const startBtn = document.getElementById(`${service}StartBtn`);
    const stopBtn = document.getElementById(`${service}StopBtn`);
    const infoEl = document.getElementById(`${service}Info`);

    const isRunning = data.status === 'running' || data.status === 'scanning';
    
    statusEl.textContent = data.status === 'scanning' ? 'Scanning' : (isRunning ? 'Running' : 'Stopped');
    statusEl.className = `status-badge ${data.status === 'scanning' ? 'scanning' : (isRunning ? 'running' : 'stopped')}`;
    
    startBtn.style.display = isRunning ? 'none' : '';
    stopBtn.style.display = isRunning ? '' : 'none';

    // Info column
    if (service === 'monitor') {
        infoEl.textContent = data.deviceCount ? `${data.deviceCount} devices` : '—';
    } else if (service === 'scanner') {
        if (data.lastScanTime) {
            const ago = timeSince(new Date(data.lastScanTime));
            infoEl.textContent = `Last: ${ago}`;
        } else {
            infoEl.textContent = '—';
        }
    } else if (service === 'heartbeat') {
        infoEl.textContent = data.isConnected ? '30s cycle' : 'Disconnected';
    }
}

// ─── Service Controls ───
async function startService(service) {
    try {
        const res = await fetch(`/api/start/${service}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showNotification(`${capitalize(service)} started`);
            refreshStatus();
        }
    } catch (err) {
        showNotification(`Failed to start ${service}`, 'error');
    }
}

async function stopService(service) {
    try {
        const res = await fetch(`/api/stop/${service}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showNotification(`${capitalize(service)} stopped`);
            refreshStatus();
        }
    } catch (err) {
        showNotification(`Failed to stop ${service}`, 'error');
    }
}

async function scanNow() {
    try {
        showNotification('Network scan started...');
        const res = await fetch('/api/scan-now', { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
            showNotification(data.error || 'Scan failed', 'error');
        }
    } catch (err) {
        showNotification('Scan request failed', 'error');
    }
}

async function restartAll() {
    try {
        showNotification('Restarting all services...');
        const res = await fetch('/api/restart-all', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showNotification('All services restarted!');
        } else {
            showNotification(data.error || 'Restart failed', 'error');
        }
        refreshStatus();
    } catch (err) {
        showNotification('Restart failed', 'error');
    }
}

// ─── Settings Modal ───
async function openSettings() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const config = data.config || {};

    document.getElementById('settingServerUrl').value = config.serverUrl || '';
    document.getElementById('settingAgentKey').value = config.agentKey || '';
    document.getElementById('settingScanCidr').value = config.scanCidr || '';
    document.getElementById('settingPollInterval').value = config.pollInterval || 5000;
    document.getElementById('settingScanInterval').value = config.scanInterval || 300000;
    document.getElementById('settingAgentName').value = config.agentName || '';
    document.getElementById('settingAutoStart').checked = config.autoStart !== false;

    document.getElementById('validationStatus').textContent = '';
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function saveSettings() {
    const config = {
        serverUrl: document.getElementById('settingServerUrl').value.trim(),
        agentKey: document.getElementById('settingAgentKey').value.trim(),
        scanCidr: document.getElementById('settingScanCidr').value.trim(),
        pollInterval: parseInt(document.getElementById('settingPollInterval').value) || 5000,
        scanInterval: parseInt(document.getElementById('settingScanInterval').value) || 300000,
        agentName: document.getElementById('settingAgentName').value.trim(),
        autoStart: document.getElementById('settingAutoStart').checked,
    };

    if (!config.serverUrl || !config.agentKey) {
        showValidation('Server URL and Agent Key are required', 'error');
        return;
    }

    showValidation('Validating connection...', '');

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const data = await res.json();

        if (data.validated) {
            showValidation(`✓ Connected to ${data.agent?.organization || 'server'}`, 'success');
            setTimeout(() => {
                closeSettings();
                refreshStatus();
                showNotification('Settings saved! Services will restart.');
            }, 1500);
        } else if (data.success) {
            showValidation('⚠ Settings saved but could not validate connection', 'error');
        } else {
            showValidation(`✗ ${data.error || 'Save failed'}`, 'error');
        }
    } catch (err) {
        showValidation(`✗ ${err.message}`, 'error');
    }
}

function showValidation(message, type) {
    const el = document.getElementById('validationStatus');
    el.textContent = message;
    el.className = `validation-status ${type || ''}`;
}

function toggleKeyVisibility() {
    const input = document.getElementById('settingAgentKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function autoDetectNetwork() {
    try {
        const res = await fetch('/api/interfaces');
        const data = await res.json();
        const container = document.getElementById('detectedNetworks');
        
        if (data.interfaces && data.interfaces.length > 0) {
            container.innerHTML = data.interfaces.map(iface => 
                `<div class="network-option" onclick="selectNetwork('${iface.cidr}')">
                    <strong>${iface.name}</strong> — ${iface.ip} (${iface.cidr})
                </div>`
            ).join('');
            container.style.display = 'block';
        } else {
            container.innerHTML = '<div class="network-option">No networks detected</div>';
            container.style.display = 'block';
        }
    } catch (err) {
        showNotification('Failed to detect networks', 'error');
    }
}

function selectNetwork(cidr) {
    document.getElementById('settingScanCidr').value = cidr;
    document.getElementById('detectedNetworks').style.display = 'none';
}

// ─── Notifications ───
function showNotification(message, type = 'info') {
    // Create a toast notification
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2000;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 10px 16px;
        background: ${type === 'error' ? '#2d1215' : '#111118'};
        border: 1px solid ${type === 'error' ? '#ff475740' : '#2a2a3a'};
        border-left: 3px solid ${type === 'error' ? '#ff4757' : '#6c5ce7'};
        border-radius: 8px;
        color: #e4e4ec;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Utilities ───
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNumber(num) {
    return num.toLocaleString();
}

function formatUptime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── CSS Animation ───
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    refreshStatus();
    // Refresh status every 2 seconds
    statusRefreshTimer = setInterval(refreshStatus, 2000);
});

// Handle settings modal close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettings();
});
