const asyncHandler = require('express-async-handler');
const { exec } = require('child_process');
const net = require('net');
const dns = require('dns');
const os = require('os');
const Device = require('../models/deviceModel');
const User = require('../models/userModel');
const Alert = require('../models/alertModel');
const DeviceMetric = require('../models/deviceMetricModel');
const { logActivity } = require('./auditController');

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
    return OUI_VENDORS[prefix] || null; // Return null if not found locally
}

// ─── Online MAC Vendor Lookup (fallback) ───
async function lookupVendorOnline(mac) {
    try {
        // Use macvendors.io free API
        const cleanMac = mac.replace(/[:-]/g, '').substring(0, 6);
        const https = require('https');
        return new Promise((resolve) => {
            const req = https.get(`https://api.macvendors.com/${cleanMac}`, { timeout: 1000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200 && data && !data.includes('Not Found')) {
                        resolve(data.trim());
                    } else {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
    } catch {
        return null;
    }
}

// ─── Run a command and return stdout ───
function runCommand(cmd, timeout = 30000) {
    return new Promise((resolve, reject) => {
        exec(cmd, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && !stdout) {
                reject(error);
            } else {
                resolve(stdout || '');
            }
        });
    });
}

// ─── Reverse DNS Lookup ───
function reverseDNS(ip) {
    return new Promise((resolve) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err || !hostnames || hostnames.length === 0) {
                resolve(null);
            } else {
                resolve(hostnames[0]);
            }
        });
    });
}

// ─── NetBIOS Name Lookup (Windows) ───
async function getNetBIOSName(ip) {
    if (os.platform() !== 'win32') return null;
    try {
        const output = await runCommand(`nbtstat -A ${ip}`, 1000);
        // Parse: "  HOSTNAME      <20>  UNIQUE      Registered"
        const match = output.match(/^\s+(\S+)\s+<00>\s+UNIQUE/m);
        if (match) return match[1].trim();
        return null;
    } catch {
        return null;
    }
}

// ─── Quick TCP Port Scan ───
function scanPort(ip, port, timeout = 500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, ip);
    });
}

async function scanCommonPorts(ip) {
    const portMap = [
        { port: 80, service: 'HTTP' },
        { port: 443, service: 'HTTPS' },
        { port: 22, service: 'SSH' },
        { port: 23, service: 'Telnet' },
        { port: 53, service: 'DNS' },
        { port: 21, service: 'FTP' },
        { port: 161, service: 'SNMP' },
        { port: 3389, service: 'RDP' },
        { port: 8080, service: 'HTTP-Alt' },
        { port: 445, service: 'SMB' },
        { port: 139, service: 'NetBIOS' },
        { port: 548, service: 'AFP' },
        { port: 631, service: 'IPP/Printing' },
        { port: 9100, service: 'Print-Raw' },
        { port: 5353, service: 'mDNS' },
        { port: 62078, service: 'iPhone-Sync' },
    ];

    // Scan all ports concurrently for speed
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
            // First try 'route print' as it's more definitive on some systems
            const routeOutput = await runCommand('route print 0.0.0.0');
            const lines = routeOutput.split('\n');
            for (const line of lines) {
                if (line.includes('0.0.0.0') && !line.includes('On-link')) {
                    const parts = line.trim().split(/\s+/);
                    // Standard Windows route print format for 0.0.0.0:
                    // Network Destination        Netmask          Gateway       Interface  Metric
                    //          0.0.0.0          0.0.0.0    192.168.1.1    192.168.1.100     25
                    if (parts.length >= 4) {
                        const gateway = parts[2];
                        if (net.isIPv4(gateway) && gateway !== '0.0.0.0') {
                            return [gateway];
                        }
                    }
                }
            }

            // Fallback to ipconfig
            const output = await runCommand('ipconfig | findstr /i "Default Gateway"');
            const matches = [...output.matchAll(/Default Gateway.*?:\s*([\d.]+)/g)];
            return matches.map(m => m[1]).filter(ip => ip && ip !== '' && ip !== '0.0.0.0');
        } else {
            const output = await runCommand("ip route | grep default | awk '{print $3}'");
            return output.trim().split('\n').filter(Boolean);
        }
    } catch {
        return [];
    }
}

// ─── Classify device type based on all gathered info ───
function classifyDevice(device) {
    const { ip = '', openPorts = [], vendor = '', hostname = '', isGateway = false } = device;
    const portNumbers = openPorts.map(p => p.port);
    const services = openPorts.map(p => p.service);
    const v = (vendor || '').toLowerCase();
    const h = (hostname || '').toLowerCase();

    // Gateway or common router IP → Router
    if (isGateway || ip.endsWith('.1') || ip.endsWith('.254')) return 'Router';

    // Router vendor (expanded) + common router ports
    if (/cisco|linksys|mikrotik|juniper|ubiquiti|netgear|d-link|tp-link|asus|belkin|arcadyan|technicolor|sagemcom|huawei|zte/.test(v)) {
        if (portNumbers.includes(23) || portNumbers.includes(161) || portNumbers.includes(80) || portNumbers.includes(53)) return 'Router';
        return 'Switch';
    }

    // DNS port 53 is strongly indicative of a Router (DNS relay) or Server
    if (portNumbers.includes(53) && !h.includes('server')) return 'Router';

    // Printer detection
    if (portNumbers.includes(631) || portNumbers.includes(9100)) return 'Printer';
    if (/epson|brother|canon|lexmark|xerox|hp/.test(v) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Printer';
    if (h.includes('printer') || h.includes('epson') || h.includes('canon')) return 'Printer';

    // Access Point detection
    if (/ubiquiti|unifi|ruckus|aruba|meraki/.test(v) && !isGateway) return 'Access Point';
    if (h.includes('ap') || h.includes('access')) return 'Access Point';

    // Mobile/Workstation detection (common mobile vendors)
    if (/apple|samsung|xiaomi|huawei|oneplus|oppo|vivo|realme|motorola|google|pixel/.test(v)) return 'Workstation';

    // iPhone/mobile specific port
    if (portNumbers.includes(62078)) return 'Workstation';

    // Server detection (SSH + HTTP/HTTPS = likely server)
    if (portNumbers.includes(22) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Server';
    if (/vmware|virtualbox|qemu|kvm|hyper-v|parallels/.test(v)) return 'Server';
    if (/dell|super micro/.test(v) && portNumbers.includes(22)) return 'Server';
    if (h.includes('server') || h.includes('nas') || h.includes('storage')) return 'Server';

    // Firewall detection
    if (/fortinet|paloalto|sonicwall|watchguard|sophos|checkpoint/.test(v)) return 'Firewall';
    if (h.includes('firewall') || h.includes('fw')) return 'Firewall';

    // Workstation with RDP or SMB
    if (portNumbers.includes(3389) || portNumbers.includes(445)) return 'Workstation';

    // Known workstation vendors
    if (/hp|dell|lenovo|acer|microsoft/.test(v)) return 'Workstation';

    // If HTTP only, could be many things - default to Other
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
                results.push({
                    name,
                    ip: addr.address,
                    netmask: addr.netmask,
                    cidr: addr.cidr
                });
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
    // Cap at 1024 IPs to keep scan time reasonable
    const maxIPs = Math.min(end - start, 1024);

    for (let i = 0; i < maxIPs; i++) {
        const addr = start + i;
        const ip = [
            (addr >>> 24) & 0xFF,
            (addr >>> 16) & 0xFF,
            (addr >>> 8) & 0xFF,
            addr & 0xFF
        ].join('.');
        ips.push(ip);
    }
    return ips;
}

// ─── Check if an IP is within a CIDR range ───
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

// ─── Ping sweep (platform-aware) ───
async function pingSweep(ips) {
    const isWindows = os.platform() === 'win32';
    const batchSize = 100;

    for (let i = 0; i < ips.length; i += batchSize) {
        const batch = ips.slice(i, i + batchSize);
        const promises = batch.map(ip => {
            const cmd = isWindows
                ? `ping -n 1 -w 200 ${ip}`
                : `ping -c 1 -W 1 ${ip}`;
            return runCommand(cmd).catch(() => null);
        });
        await Promise.all(promises);
    }
}

// ─── Parse ARP table (platform-aware) ───
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
                    if (mac === 'FF:FF:FF:FF:FF:FF') continue;
                    if (mac.startsWith('01:00:5E')) continue;
                    if (mac.startsWith('33:33')) continue;
                    devices.push({ ip: match[1], mac });
                }
            } else {
                const match = line.match(/\(([\d.]+)\)\s+at\s+([0-9a-fA-F:]{17})/);
                if (match) {
                    const mac = match[2].toUpperCase();
                    if (mac === 'FF:FF:FF:FF:FF:FF') continue;
                    if (mac.startsWith('01:00:5E')) continue;
                    if (mac.startsWith('33:33')) continue;
                    devices.push({ ip: match[1], mac });
                }
            }
        }
        return devices;
    } catch (error) {
        console.error('[ARP] Failed to read ARP table:', error.message);
        return [];
    }
}

// ─── Deep probe a single device ───
async function probeDevice(ip, mac, gateways) {
    console.log(`  [PROBE] ${ip} ...`);

    // Run probes concurrently for speed
    const [hostname, openPorts, onlineVendor] = await Promise.all([
        reverseDNS(ip),
        scanCommonPorts(ip),
        (lookupVendor(mac) === null) ? lookupVendorOnline(mac) : Promise.resolve(null),
    ]);

    // Only run slow nbtstat if SMB/NetBIOS ports are actually open
    let netbiosName = null;
    if (openPorts.some(p => p.port === 139 || p.port === 445)) {
        netbiosName = await getNetBIOSName(ip);
    }

    const localVendor = lookupVendor(mac);
    const vendor = localVendor || onlineVendor || 'Unknown';
    const isGateway = gateways.includes(ip);
    const resolvedName = netbiosName || hostname || '';

    const deviceInfo = {
        ip,
        mac,
        hostname: resolvedName,
        openPorts,
        vendor,
        isGateway,
    };

    const type = classifyDevice(deviceInfo);

    // Improve naming logic
    let finalName = resolvedName;
    if (type === 'Router') {
        if (!finalName || finalName.toLowerCase().includes('reliance')) {
            finalName = vendor !== 'Unknown' ? `${vendor} Router` : 'Network Router';
        }
    } else if (finalName === '' && vendor !== 'Unknown') {
        finalName = `${vendor} ${type}`;
    }

    console.log(`  [PROBE] ${ip} → ${type} | ${vendor} | name="${finalName}" | ports=[${openPorts.map(p => p.port).join(',')}]${isGateway ? ' [GATEWAY]' : ''}`);

    return {
        ip,
        mac,
        type,
        vendor,
        status: 'Online',
        hostname: finalName,
        openPorts: openPorts.map(p => ({ port: p.port, service: p.service })),
        isGateway,
    };
}

// ══════════════════════════════════════════════════
// CONTROLLERS
// ══════════════════════════════════════════════════

// @desc    Scan network for devices (REAL deep scan)
// @route   POST /api/v1/devices/scan
// @access  Private
const scanNetwork = asyncHandler(async (req, res) => {
    const { ipRange, scanMethod } = req.body;

    if (!ipRange) {
        res.status(400);
        throw new Error('Please provide an IP range');
    }

    console.log(`\n[SCAN] ════════════════════════════════════════`);
    console.log(`[SCAN] User ${req.user._id} scanning ${ipRange} via ${scanMethod || 'icmp'}`);
    console.log(`[SCAN] Platform: ${os.platform()}`);

    // Step 1: Get default gateways and local interfaces
    const gateways = await getDefaultGateway();
    const localNets = getLocalNetworkInfo();
    console.log(`[SCAN] Gateways: ${gateways.join(', ') || 'none detected'}`);
    console.log(`[SCAN] Local IPs: ${localNets.map(n => n.ip).join(', ')}`);

    // Find which local interface is in the scan range (to add "this device")
    const selfInterface = localNets.find(n => isIPInCIDR(n.ip, ipRange));
    if (selfInterface) {
        console.log(`[SCAN] This device: ${selfInterface.ip} (${selfInterface.name})`);
    }

    // Step 2: Ping sweep  
    console.log(`[SCAN] Starting ping sweep on ${ipRange}...`);
    const ips = getIPsFromCIDR(ipRange);
    console.log(`[SCAN] Pinging ${ips.length} addresses`);
    await pingSweep(ips);
    console.log(`[SCAN] Ping sweep complete`);

    // Step 3: Read ARP table (global + interface-specific on Windows)
    console.log(`[SCAN] Reading ARP table...`);
    let arpDevices = await getArpTable();

    // On Windows, also try reading ARP for the specific interface
    if (os.platform() === 'win32' && selfInterface) {
        try {
            const specificArp = await runCommand(`arp -a -N ${selfInterface.ip}`);
            const lines = specificArp.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s+([\d.]+)\s+([0-9a-fA-F-]{17})\s+(dynamic|static)/i);
                if (match) {
                    const mac = match[2].replace(/-/g, ':').toUpperCase();
                    if (mac === 'FF:FF:FF:FF:FF:FF') continue;
                    if (mac.startsWith('01:00:5E')) continue;
                    if (mac.startsWith('33:33')) continue;
                    // Add if not already in the list
                    if (!arpDevices.find(d => d.ip === match[1])) {
                        arpDevices.push({ ip: match[1], mac });
                    }
                }
            }
            console.log(`[SCAN] After interface-specific ARP: ${arpDevices.length} devices`);
        } catch (e) {
            // ignore
        }
    }

    console.log(`[SCAN] Found ${arpDevices.length} total devices in ARP table`);

    // Step 4: Filter to requested CIDR range (proper bitmask check)
    const filteredDevices = arpDevices.filter(d => isIPInCIDR(d.ip, ipRange));
    console.log(`[SCAN] ${filteredDevices.length} devices within ${ipRange}`);

    // Step 5: Add self device if it's in range and not already found
    if (selfInterface && !filteredDevices.find(d => d.ip === selfInterface.ip)) {
        // Get our own MAC address
        const interfaces = os.networkInterfaces();
        let selfMac = '00:00:00:00:00:00';
        const iface = interfaces[selfInterface.name];
        if (iface) {
            for (const addr of iface) {
                if (addr.family === 'IPv4' && addr.mac && addr.mac !== '00:00:00:00:00:00') {
                    selfMac = addr.mac.toUpperCase();
                    break;
                }
            }
        }
        filteredDevices.push({ ip: selfInterface.ip, mac: selfMac });
        console.log(`[SCAN] Added self device: ${selfInterface.ip} (${selfMac})`);
    }

    // Step 6: Deep probe each device (hostname, ports, vendor)
    console.log(`[SCAN] Starting deep probe of ${filteredDevices.length} devices...`);

    // Get existing devices to mark them
    const existingDevices = await Device.find({ organization: req.user.organization }, 'ip mac');
    const existingIps = existingDevices.map(d => d.ip);
    const existingMacs = existingDevices.map(d => d.mac);

    const enrichedDevices = await Promise.all(
        filteredDevices.map(async (d) => {
            const result = await probeDevice(d.ip, d.mac, gateways);
            // Mark self
            if (selfInterface && d.ip === selfInterface.ip) {
                result.hostname = result.hostname || os.hostname();
                result.type = 'Workstation';
                result.isSelf = true;
            }
            // Check if already in DB
            result.isAlreadyAdded = existingIps.includes(d.ip) || existingMacs.includes(d.mac);
            return result;
        })
    );

    // Sort by IP
    enrichedDevices.sort((a, b) => {
        const aParts = a.ip.split('.').map(Number);
        const bParts = b.ip.split('.').map(Number);
        for (let i = 0; i < 4; i++) {
            if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
        }
        return 0;
    });

    console.log(`[SCAN] ✓ Returning ${enrichedDevices.length} devices`);
    console.log(`[SCAN] ════════════════════════════════════════\n`);

    // Log the scan action
    await logActivity({
        req,
        action: 'Scan Network',
        target: ipRange,
        result: 'Success'
    });

    res.json({
        success: true,
        count: enrichedDevices.length,
        scanMethod: scanMethod || 'icmp',
        ipRange,
        devices: enrichedDevices
    });
});

// @desc    Add specific discovered devices (Append)
// @route   POST /api/v1/devices/add
// @access  Private
const addDevices = asyncHandler(async (req, res) => {
    const { devices } = req.body;

    if (!devices || !Array.isArray(devices) || devices.length === 0) {
        res.status(400);
        throw new Error('Please provide devices to add');
    }

    console.log(`[ADD] User ${req.user._id} adding ${devices.length} new devices`);

    const deviceDocs = [];
    for (const d of devices) {
        // Double check they don't already exist
        const exists = await Device.findOne({ 
            organization: req.user.organization, 
            $or: [{ ip: d.ip }, { mac: d.mac }] 
        });

        if (!exists) {
            deviceDocs.push({
                user: req.user._id,
                organization: req.user.organization,
                ip: d.ip,
                mac: d.mac,
                type: d.type || 'Other',
                status: d.status || 'Online',
                name: d.name || d.hostname || '',
                hostname: d.hostname || '',
                vendor: d.vendor || 'Unknown',
                openPorts: d.openPorts || [],
                isGateway: d.isGateway || false
            });
        }
    }

    let savedDevices = [];
    if (deviceDocs.length > 0) {
        savedDevices = await Device.insertMany(deviceDocs);
    }

    // Log the add action
    await logActivity({
        req,
        action: 'Add Devices',
        target: `${savedDevices.length} devices added`,
        result: 'Success'
    });

    res.status(201).json({
        success: true,
        count: savedDevices.length,
        devices: savedDevices
    });
});

// @desc    Save discovered devices after setup (Reset & Overwrite)
// @route   POST /api/v1/devices/setup
// @access  Private
const saveDevices = asyncHandler(async (req, res) => {
    const { devices } = req.body;

    if (!devices || !Array.isArray(devices) || devices.length === 0) {
        res.status(400);
        throw new Error('Please provide devices to save');
    }

    console.log(`[SETUP] User ${req.user._id} saving ${devices.length} devices (Wipe & Reset for Org: ${req.user.organization})`);

    await Device.deleteMany({ organization: req.user.organization });

    const deviceDocs = devices.map(device => ({
        user: req.user._id,
        organization: req.user.organization,
        ip: device.ip,
        mac: device.mac,
        type: device.type || 'Other',
        status: device.status || 'Online',
        name: device.name || device.hostname || '',
        hostname: device.hostname || '',
        vendor: device.vendor || 'Unknown',
        openPorts: device.openPorts || [],
        isGateway: device.isGateway || false
    }));

    const savedDevices = await Device.insertMany(deviceDocs);
    await User.findByIdAndUpdate(req.user._id, { setupCompleted: true });

    res.status(201).json({
        success: true,
        count: savedDevices.length,
        devices: savedDevices
    });
});

// @desc    Get all devices for current user
// @route   GET /api/v1/devices
// @access  Private
const getDevices = asyncHandler(async (req, res) => {
    const devices = await Device.find({ organization: req.user.organization }).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: devices.length,
        devices
    });
});

// @desc    Delete a device
// @route   DELETE /api/v1/devices/:id
// @access  Private
const deleteDevice = asyncHandler(async (req, res) => {
    const device = await Device.findOne({ _id: req.params.id, organization: req.user.organization });

    if (!device) {
        res.status(404);
        throw new Error('Device not found');
    }

    console.log(`[DELETE] User ${req.user._id} deleting device ${device.ip} (${device._id})`);

    // Clean up associated data
    await DeviceMetric.deleteMany({ deviceId: device._id });
    await Alert.deleteMany({ deviceId: device._id });
    
    // Delete the device itself
    await Device.deleteOne({ _id: device._id });

    // Log the delete action
    await logActivity({
        req,
        action: 'Delete Device',
        target: device.ip,
        result: 'Success'
    });

    res.json({
        success: true,
        message: 'Device and associated data removed successfully'
    });
});

// @desc    Get server's network interfaces
// @route   GET /api/v1/devices/interfaces
// @access  Private
const getInterfaces = asyncHandler(async (req, res) => {
    // Helper to get local network info
    const getLocalNetworkInfo = () => {
        const interfaces = os.networkInterfaces();
        const results = [];

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    results.push({
                        name,
                        ip: iface.address,
                        netmask: iface.netmask,
                        mac: iface.mac
                    });
                }
            }
        }
        return results;
    };

    const allInterfaces = getLocalNetworkInfo();
    const virtualPatterns = /hyper-v|vethernet|docker|vmnet|virtualbox|vbox|wsl|loopback/i;

    const interfaces = allInterfaces.map(iface => {
        const isVirtual = virtualPatterns.test(iface.name);
        const parts = iface.ip.split('.');
        const subnetBase = parts.slice(0, 3).join('.') + '.0';
        const maskParts = iface.netmask.split('.').map(Number);
        let prefix = 0;
        for (const part of maskParts) {
            prefix += (part >>> 0).toString(2).split('1').length - 1;
        }
        const cidr = `${subnetBase}/${prefix || 24}`;

        return {
            name: iface.name,
            ip: iface.ip,
            netmask: iface.netmask,
            cidr,
            isVirtual
        };
    });

    interfaces.sort((a, b) => (a.isVirtual === b.isVirtual ? 0 : a.isVirtual ? 1 : -1));

    res.json({
        success: true,
        interfaces
    });
});

module.exports = {
    scanNetwork,
    saveDevices,
    addDevices,
    deleteDevice,
    getDevices,
    getInterfaces
};
