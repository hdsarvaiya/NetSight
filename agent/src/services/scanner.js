const net = require('net');
const dns = require('dns');
const os = require('os');
const { exec } = require('child_process');
const ping = require('ping');
const logger = require('./logger');

// ─── OUI Vendor Lookup (common prefixes) ───
const OUI_VENDORS = {
    '00:1A:2B': 'Cisco', '00:50:56': 'VMware', '00:0C:29': 'VMware',
    '00:15:5D': 'Microsoft Hyper-V', 'B8:27:EB': 'Raspberry Pi',
    'DC:A6:32': 'Raspberry Pi', '00:1E:68': 'Quanta', '00:25:90': 'Super Micro',
    '00:1C:42': 'Parallels', '08:00:27': 'Oracle VirtualBox',
    'AC:DE:48': 'Private', '00:26:B9': 'Dell', '00:14:22': 'Dell',
    'D4:BE:D9': 'Dell', '18:03:73': 'Dell', 'F8:DB:88': 'Dell',
    '00:1A:A0': 'Dell', '3C:D9:2B': 'HP', '00:1E:0B': 'HP',
    '00:21:5A': 'HP', '00:25:B3': 'HP', 'EC:B1:D7': 'HP',
    '00:1B:78': 'HP', '00:17:A4': 'HP', '9C:8E:99': 'HP',
    '00:0B:CD': 'HP', '00:1F:29': 'HP', 'F4:39:09': 'HP',
    '00:23:7D': 'HP', '28:80:23': 'TP-Link', '50:C7:BF': 'TP-Link',
    'C0:25:E9': 'TP-Link', '14:CC:20': 'TP-Link', '60:32:B1': 'TP-Link',
    'EC:08:6B': 'TP-Link', 'AC:84:C6': 'TP-Link', '00:23:CD': 'TP-Link',
    '18:D6:C7': 'TP-Link', 'B0:4E:26': 'TP-Link',
    '78:8A:20': 'Ubiquiti', 'FC:EC:DA': 'Ubiquiti', '24:5A:4C': 'Ubiquiti',
    '04:18:D6': 'Ubiquiti', '68:72:51': 'Ubiquiti', '80:2A:A8': 'Ubiquiti',
    'F0:9F:C2': 'Ubiquiti', 'B4:FB:E4': 'Ubiquiti',
    '00:1B:21': 'Intel', '68:05:CA': 'Intel', '00:1E:67': 'Intel',
    '3C:97:0E': 'Intel', 'A4:C4:94': 'Intel', '00:1F:3B': 'Intel',
    '00:13:02': 'Intel', '8C:EC:4B': 'Intel',
    'F8:75:A4': 'ASUS', '00:1D:60': 'ASUSTek', '1C:87:2C': 'ASUS',
    '2C:56:DC': 'ASUS', '60:45:CB': 'ASUS',
    '00:1E:58': 'D-Link', '00:22:B0': 'D-Link', '1C:7E:E5': 'D-Link',
    '28:10:7B': 'D-Link', 'B8:A3:86': 'D-Link', 'C8:BE:19': 'D-Link',
    'F0:7D:68': 'D-Link', 'CC:B2:55': 'D-Link',
    '00:1A:6B': 'Cisco', '00:1E:F7': 'Cisco', '58:AC:78': 'Cisco',
    '00:26:0B': 'Cisco', '00:1C:0E': 'Cisco', '00:24:C4': 'Cisco',
    '00:0D:EC': 'Cisco', '00:12:43': 'Cisco', '00:19:55': 'Cisco',
    '00:1B:0D': 'Cisco', 'B0:7D:47': 'Cisco',
    '20:AA:4B': 'Cisco/Linksys', '00:25:9C': 'Cisco/Linksys',
    'C0:56:27': 'Belkin', '94:10:3E': 'Belkin',
    'E8:48:B8': 'Samsung', '00:21:19': 'Samsung', '00:26:37': 'Samsung',
    'A8:F2:74': 'Samsung', '00:1E:E1': 'Samsung', '84:25:DB': 'Samsung',
    'AC:5F:3E': 'Samsung', 'F0:25:B7': 'Samsung',
    '00:25:00': 'Apple', '00:1C:B3': 'Apple', '00:23:6C': 'Apple',
    '3C:15:C2': 'Apple', 'A4:D1:8C': 'Apple', 'F0:D1:A9': 'Apple',
    'D0:25:98': 'Apple', '14:10:9F': 'Apple', '00:1E:52': 'Apple',
    'E0:B9:BA': 'Apple', '28:CF:DA': 'Apple', '7C:D1:C3': 'Apple',
    '00:21:E9': 'Apple', '40:A6:D9': 'Apple',
    '00:24:E8': 'Dell', '00:22:19': 'Dell', 'B8:AC:6F': 'Dell',
    '00:1A:4A': 'Qnap', 'E0:D5:5E': 'GIGA-BYTE',
    '00:50:43': 'Marvell', '00:06:5B': 'Dell', '34:17:EB': 'Dell',
    '00:E0:4C': 'Realtek', '52:54:00': 'QEMU/KVM',
    '28:6C:07': 'Xiaomi', '00:9E:C8': 'Xiaomi', '64:CC:2E': 'Xiaomi',
    '78:11:DC': 'Xiaomi', 'FC:64:BA': 'Xiaomi',
    'D8:0D:17': 'TP-Link', 'B0:BE:76': 'TP-Link',
    '00:18:E7': 'Cameo', '00:09:5B': 'Netgear', '00:1B:2F': 'Netgear',
    '00:1E:2A': 'Netgear', '00:1F:33': 'Netgear', '20:4E:7F': 'Netgear',
    'A4:2B:8C': 'Netgear', 'B0:48:7A': 'Netgear', 'C4:04:15': 'Netgear',
    'E0:46:9A': 'Netgear', 'E0:91:F5': 'Netgear',
    '00:E0:18': 'Asustek', '1C:6F:65': 'GIGA-BYTE',
    '00:1C:C0': 'Intel', '00:03:47': 'Intel', '00:A0:C9': 'Intel',
    'F4:8E:38': 'Apple', 'AC:BC:32': 'Apple', '00:17:F2': 'Apple',
    '70:56:81': 'Apple', 'A8:86:DD': 'Apple', '48:D7:05': 'Apple',
};

function lookupVendor(mac) {
    if (!mac) return 'Unknown';
    const normalized = mac.replace(/[-:]/g, ':').toUpperCase();
    const prefix = normalized.substring(0, 8);
    return OUI_VENDORS[prefix] || 'Unknown';
}

// ─── Run a command and return stdout ───
function runCommand(cmd, timeout = 30000) {
    return new Promise((resolve, reject) => {
        exec(cmd, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && !stdout) reject(error);
            else resolve(stdout || '');
        });
    });
}

// ─── Reverse DNS Lookup ───
function reverseDNS(ip) {
    return new Promise((resolve) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err || !hostnames || hostnames.length === 0) resolve(null);
            else resolve(hostnames[0]);
        });
    });
}

// ─── NetBIOS Name Lookup (Windows) ───
async function getNetBIOSName(ip) {
    if (os.platform() !== 'win32') return null;
    try {
        const output = await runCommand(`nbtstat -A ${ip}`, 800);
        const match = output.match(/^\s+(\S+)\s+<00>\s+UNIQUE/m);
        if (match) return match[1].trim();
        return null;
    } catch { return null; }
}

// ─── Port Scanner ───
function scanPort(ip, port, timeout = 200) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, ip);
    });
}

async function scanCommonPorts(ip) {
    const portMap = [
        { port: 80, service: 'HTTP' }, { port: 443, service: 'HTTPS' },
        { port: 22, service: 'SSH' }, { port: 23, service: 'Telnet' },
        { port: 53, service: 'DNS' }, { port: 21, service: 'FTP' },
        { port: 161, service: 'SNMP' }, { port: 3389, service: 'RDP' },
        { port: 8080, service: 'HTTP-Alt' }, { port: 445, service: 'SMB' },
        { port: 139, service: 'NetBIOS' }, { port: 548, service: 'AFP' },
        { port: 631, service: 'IPP/Printing' }, { port: 9100, service: 'Print-Raw' },
        { port: 5353, service: 'mDNS' }, { port: 62078, service: 'iPhone-Sync' },
    ];
    const results = await Promise.all(
        portMap.map(async ({ port, service }) => {
            const isOpen = await scanPort(ip, port);
            return isOpen ? { port, service } : null;
        })
    );
    return results.filter(Boolean);
}

// ─── Get Default Gateway ───
async function getDefaultGateway() {
    try {
        if (os.platform() === 'win32') {
            const routeOutput = await runCommand('route print 0.0.0.0');
            const lines = routeOutput.split('\n');
            for (const line of lines) {
                if (line.includes('0.0.0.0') && !line.includes('On-link')) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 4) {
                        const gateway = parts[2];
                        if (net.isIPv4(gateway) && gateway !== '0.0.0.0') return [gateway];
                    }
                }
            }
            const output = await runCommand('ipconfig | findstr /i "Default Gateway"');
            const matches = [...output.matchAll(/Default Gateway.*?:\s*([\d.]+)/g)];
            return matches.map(m => m[1]).filter(ip => ip && ip !== '' && ip !== '0.0.0.0');
        } else {
            const output = await runCommand("ip route | grep default | awk '{print $3}'");
            return output.trim().split('\n').filter(Boolean);
        }
    } catch { return []; }
}

// ─── Classify device type ───
function classifyDevice(device) {
    const { ip = '', openPorts = [], vendor = '', hostname = '', isGateway = false } = device;
    const portNumbers = openPorts.map(p => p.port);
    const v = (vendor || '').toLowerCase();
    const h = (hostname || '').toLowerCase();

    if (isGateway || ip.endsWith('.1') || ip.endsWith('.254')) return 'Router';
    if (/cisco|linksys|mikrotik|juniper|ubiquiti|netgear|d-link|tp-link|asus|belkin|arcadyan|technicolor|sagemcom|huawei|zte/.test(v)) {
        if (portNumbers.includes(23) || portNumbers.includes(161) || portNumbers.includes(80) || portNumbers.includes(53)) return 'Router';
        return 'Switch';
    }
    if (portNumbers.includes(53) && !h.includes('server')) return 'Router';
    if (portNumbers.includes(631) || portNumbers.includes(9100)) return 'Printer';
    if (/epson|brother|canon|lexmark|xerox|hp/.test(v) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Printer';
    if (h.includes('printer') || h.includes('epson') || h.includes('canon')) return 'Printer';
    if (/ubiquiti|unifi|ruckus|aruba|meraki/.test(v) && !isGateway) return 'Access Point';
    if (h.includes('ap') || h.includes('access')) return 'Access Point';
    if (/apple|samsung|xiaomi|huawei|oneplus|oppo|vivo|realme|motorola|google|pixel/.test(v)) return 'Workstation';
    if (portNumbers.includes(62078)) return 'Workstation';
    if (portNumbers.includes(22) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Server';
    if (/vmware|virtualbox|qemu|kvm|hyper-v|parallels/.test(v)) return 'Server';
    if (/dell|super micro/.test(v) && portNumbers.includes(22)) return 'Server';
    if (h.includes('server') || h.includes('nas') || h.includes('storage')) return 'Server';
    if (/fortinet|paloalto|sonicwall|watchguard|sophos|checkpoint/.test(v)) return 'Firewall';
    if (h.includes('firewall') || h.includes('fw')) return 'Firewall';
    if (portNumbers.includes(3389) || portNumbers.includes(445)) return 'Workstation';
    if (/hp|dell|lenovo|acer|microsoft/.test(v)) return 'Workstation';
    if (portNumbers.includes(80) && portNumbers.length <= 2) return 'Other';
    return 'Other';
}

// ─── Get local network info ───
function getLocalNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const results = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                results.push({ name, ip: addr.address, netmask: addr.netmask, cidr: addr.cidr, mac: addr.mac });
            }
        }
    }
    return results;
}

// ─── Calculate IP range from CIDR ───
function getIPsFromCIDR(cidr) {
    const [baseIP, prefixLen] = cidr.split('/');
    const prefix = parseInt(prefixLen, 10);
    if (prefix < 16) return [];
    const parts = baseIP.split('.').map(Number);
    const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    const mask = (~0) << (32 - prefix);
    const network = ipNum & mask;
    const broadcast = network | (~mask & 0xFFFFFFFF);
    const ips = [];
    const start = (network >>> 0) + 1;
    const end = (broadcast >>> 0);
    const maxIPs = Math.min(end - start, 1024);
    for (let i = 0; i < maxIPs; i++) {
        const addr = start + i;
        ips.push([
            (addr >>> 24) & 0xFF, (addr >>> 16) & 0xFF,
            (addr >>> 8) & 0xFF, addr & 0xFF
        ].join('.'));
    }
    return ips;
}

function isIPInCIDR(ip, cidr) {
    const [baseIP, prefixLen] = cidr.split('/');
    const prefix = parseInt(prefixLen, 10);
    const mask = (~0) << (32 - prefix);
    const baseParts = baseIP.split('.').map(Number);
    const baseNum = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3];
    const network = baseNum & mask;
    const ipParts = ip.split('.').map(Number);
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    return (ipNum & mask) === network;
}

// ─── TCP & ICMP sweep to populate ARP table ───
async function pingSweep(ips) {
    const BATCH = 100;
    for (let i = 0; i < ips.length; i += BATCH) {
        const batch = ips.slice(i, i + BATCH);
        await Promise.all(batch.map(ip => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(150);
                socket.on('connect', () => { socket.destroy(); resolve(); });
                socket.on('timeout', () => { socket.destroy(); resolve(); });
                socket.on('error', () => { socket.destroy(); resolve(); });
                socket.connect(445, ip);
            });
        }));
    }
    if (os.platform() === 'win32') {
        const pingBatch = ips.slice(0, Math.min(ips.length, 255));
        await Promise.all(pingBatch.map(ip =>
            runCommand(`ping -n 1 -w 200 ${ip}`).catch(() => null)
        ));
    }
}

// ─── Parse ARP table ───
async function getArpTable() {
    const isWindows = os.platform() === 'win32';
    try {
        const output = await runCommand('arp -a');
        const devices = [];
        const lines = output.split('\n');
        for (const line of lines) {
            if (isWindows) {
                const match = line.match(/^\s+([\d.]+)\s+([0-9a-fA-F-]{17})\s+(dynamic|static)/i);
                if (match) {
                    const mac = match[2].replace(/-/g, ':').toUpperCase();
                    if (mac === 'FF:FF:FF:FF:FF:FF' || mac.startsWith('01:00:5E') || mac.startsWith('33:33')) continue;
                    devices.push({ ip: match[1], mac });
                }
            } else {
                const match = line.match(/\(([\d.]+)\)\s+at\s+([0-9a-fA-F:]{17})/);
                if (match) {
                    const mac = match[2].toUpperCase();
                    if (mac === 'FF:FF:FF:FF:FF:FF' || mac.startsWith('01:00:5E') || mac.startsWith('33:33')) continue;
                    devices.push({ ip: match[1], mac });
                }
            }
        }
        return devices;
    } catch (error) {
        logger.error(`Failed to read ARP table: ${error.message}`, 'scanner');
        return [];
    }
}

// ─── Deep probe a single device ───
async function probeDevice(ip, mac, gateways) {
    const [hostname, netbiosName, openPorts] = await Promise.all([
        reverseDNS(ip),
        getNetBIOSName(ip),
        scanCommonPorts(ip),
    ]);

    const vendor = lookupVendor(mac);
    const isGateway = gateways.includes(ip);
    const resolvedName = netbiosName || hostname || '';

    const deviceInfo = { ip, mac, hostname: resolvedName, openPorts, vendor, isGateway };
    const type = classifyDevice(deviceInfo);

    let finalName = resolvedName;
    if (type === 'Router') {
        if (!finalName || finalName.toLowerCase().includes('reliance')) {
            finalName = vendor !== 'Unknown' ? `${vendor} Router` : 'Network Router';
        }
    } else if (finalName === '' && vendor !== 'Unknown') {
        finalName = `${vendor} ${type}`;
    }

    return {
        ip, mac, type, vendor, status: 'Online',
        hostname: finalName,
        openPorts: openPorts.map(p => ({ port: p.port, service: p.service })),
        isGateway,
    };
}

// ═══════════════════════════════════════════
// MAIN SCAN FUNCTION
// ═══════════════════════════════════════════

let isScanning = false;
let scanTimer = null;
let lastScanTime = null;
let scanStats = { devicesFound: 0, lastScanDuration: 0 };

async function scanNetwork(cidr) {
    if (isScanning) {
        logger.warn('Scan already in progress, skipping...', 'scanner');
        return null;
    }
    isScanning = true;
    const startTime = Date.now();

    try {
        logger.info(`Starting network scan on ${cidr}...`, 'scanner');

        // Step 1: Get gateways and local interfaces
        const gateways = await getDefaultGateway();
        const localNets = getLocalNetworkInfo();
        const selfInterface = localNets.find(n => isIPInCIDR(n.ip, cidr));

        logger.info(`Gateways: ${gateways.join(', ') || 'none'}`, 'scanner');

        // Step 2: Ping sweep
        const ips = getIPsFromCIDR(cidr);
        logger.info(`Sweeping ${ips.length} addresses...`, 'scanner');
        await pingSweep(ips);

        // Step 3: Read ARP table
        let arpDevices = await getArpTable();

        // Windows: also try interface-specific ARP
        if (os.platform() === 'win32' && selfInterface) {
            try {
                const specificArp = await runCommand(`arp -a -N ${selfInterface.ip}`);
                const lines = specificArp.split('\n');
                for (const line of lines) {
                    const match = line.match(/^\s+([\d.]+)\s+([0-9a-fA-F-]{17})\s+(dynamic|static)/i);
                    if (match) {
                        const mac = match[2].replace(/-/g, ':').toUpperCase();
                        if (mac === 'FF:FF:FF:FF:FF:FF' || mac.startsWith('01:00:5E') || mac.startsWith('33:33')) continue;
                        if (!arpDevices.find(d => d.ip === match[1])) {
                            arpDevices.push({ ip: match[1], mac });
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }

        logger.info(`Found ${arpDevices.length} devices in ARP table`, 'scanner');

        // Step 4: Filter to requested CIDR range
        const filteredDevices = arpDevices.filter(d => isIPInCIDR(d.ip, cidr));

        // Step 5: Add self device and default gateways explicitly
        if (selfInterface && !filteredDevices.find(d => d.ip === selfInterface.ip)) {
            filteredDevices.push({ ip: selfInterface.ip, mac: selfInterface.mac?.toUpperCase() || '00:00:00:00:00:00' });
        }
        for (const gw of gateways) {
            if (isIPInCIDR(gw, cidr) && !filteredDevices.find(d => d.ip === gw)) {
                filteredDevices.push({ ip: gw, mac: '00:00:00:00:00:00' });
            }
        }

        // Step 6: Deep probe each device
        logger.info(`Deep probing ${filteredDevices.length} devices...`, 'scanner');
        const enrichedDevices = [];
        const PROBE_BATCH = 10;
        for (let i = 0; i < filteredDevices.length; i += PROBE_BATCH) {
            const batch = filteredDevices.slice(i, i + PROBE_BATCH);
            const results = await Promise.all(
                batch.map(async (d) => {
                    const result = await probeDevice(d.ip, d.mac, gateways);
                    if (selfInterface && d.ip === selfInterface.ip) {
                        result.hostname = result.hostname || os.hostname();
                        result.type = 'Workstation';
                        result.isSelf = true;
                    }
                    logger.info(`${d.ip} → ${result.type} | ${result.vendor} | "${result.hostname}"`, 'scanner');
                    return result;
                })
            );
            enrichedDevices.push(...results);
        }

        // Sort by IP
        enrichedDevices.sort((a, b) => {
            const aParts = a.ip.split('.').map(Number);
            const bParts = b.ip.split('.').map(Number);
            for (let i = 0; i < 4; i++) {
                if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
            }
            return 0;
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        lastScanTime = new Date();
        scanStats = { devicesFound: enrichedDevices.length, lastScanDuration: parseFloat(duration) };

        logger.success(`Scan complete: ${enrichedDevices.length} devices found in ${duration}s`, 'scanner');

        return enrichedDevices;
    } catch (error) {
        logger.error(`Scan failed: ${error.message}`, 'scanner');
        return null;
    } finally {
        isScanning = false;
    }
}

function startPeriodicScan(cidr, interval, onScanComplete) {
    if (scanTimer) clearInterval(scanTimer);

    // Initial scan
    scanNetwork(cidr).then(devices => {
        if (devices && onScanComplete) onScanComplete(devices);
    });

    // Periodic scan
    scanTimer = setInterval(async () => {
        const devices = await scanNetwork(cidr);
        if (devices && onScanComplete) onScanComplete(devices);
    }, interval);

    logger.info(`Periodic scanning started (every ${interval / 1000}s)`, 'scanner');
}

function stopPeriodicScan() {
    if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
        logger.info('Periodic scanning stopped', 'scanner');
    }
}

function getScanStatus() {
    return {
        isScanning,
        lastScanTime,
        ...scanStats,
    };
}

module.exports = {
    scanNetwork,
    startPeriodicScan,
    stopPeriodicScan,
    getScanStatus,
    getLocalNetworkInfo,
    isScanning: () => isScanning,
};
