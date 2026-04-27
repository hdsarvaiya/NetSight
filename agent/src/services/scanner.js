const net = require('net');
const dgram = require('dgram');
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
        // Switch-specific ports
        { port: 8291, service: 'MikroTik-Winbox' },
        { port: 8443, service: 'UniFi-HTTPS' },
        { port: 8728, service: 'MikroTik-API' },
        { port: 830, service: 'NETCONF' },
        { port: 4786, service: 'Cisco-Smart-Install' },
    ];
    const results = await Promise.all(
        portMap.map(async ({ port, service }) => {
            const isOpen = await scanPort(ip, port);
            return isOpen ? { port, service } : null;
        })
    );
    return results.filter(Boolean);
}

// ─── UDP SNMP Probe (detects managed switches/routers) ───
function snmpProbe(ip, timeout = 1500) {
    return new Promise((resolve) => {
        try {
            const client = dgram.createSocket('udp4');
            let resolved = false;

            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    try { client.close(); } catch (e) {}
                    resolve({ responds: false, sysDescr: null });
                }
            }, timeout);

            client.on('message', (msg) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                try { client.close(); } catch (e) {}
                const sysDescr = parseSNMPResponse(msg);
                resolve({ responds: true, sysDescr });
            });

            client.on('error', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                try { client.close(); } catch (e) {}
                resolve({ responds: false, sysDescr: null });
            });

            // SNMPv1 GET-REQUEST for sysDescr.0 (1.3.6.1.2.1.1.1.0) community="public"
            const packet = Buffer.from([
                0x30, 0x26,
                0x02, 0x01, 0x00,
                0x04, 0x06, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63,
                0xa0, 0x19,
                0x02, 0x01, 0x01,
                0x02, 0x01, 0x00,
                0x02, 0x01, 0x00,
                0x30, 0x0e,
                0x30, 0x0c,
                0x06, 0x08, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x01, 0x00,
                0x05, 0x00
            ]);

            client.send(packet, 161, ip);
        } catch (e) {
            resolve({ responds: false, sysDescr: null });
        }
    });
}

function parseSNMPResponse(buf) {
    try {
        // Walk through buffer looking for OCTET STRING (tag 0x04) with meaningful length
        for (let i = 20; i < buf.length - 2; i++) {
            if (buf[i] === 0x04) {
                let len, offset;
                if (buf[i + 1] & 0x80) {
                    // Long-form length
                    const numLenBytes = buf[i + 1] & 0x7f;
                    if (numLenBytes === 1) {
                        len = buf[i + 2];
                        offset = i + 3;
                    } else if (numLenBytes === 2) {
                        len = (buf[i + 2] << 8) | buf[i + 3];
                        offset = i + 4;
                    } else { continue; }
                } else {
                    len = buf[i + 1];
                    offset = i + 2;
                }
                if (len > 5 && offset + len <= buf.length) {
                    const str = buf.slice(offset, offset + len).toString('utf8');
                    if (/[a-zA-Z]/.test(str)) return str;
                }
            }
        }
        return null;
    } catch (e) { return null; }
}

// ─── TTL-based OS Detection ───
async function getTTL(ip) {
    try {
        const isWindows = os.platform() === 'win32';
        const cmd = isWindows ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;
        const output = await runCommand(cmd, 3000);
        const match = output.match(/ttl[=:](\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
    } catch { return 0; }
}

function guessOSFromTTL(ttl) {
    if (ttl <= 0) return null;
    if (ttl <= 32) return 'Embedded/IoT';
    if (ttl <= 64) return 'Linux/Unix';
    if (ttl <= 128) return 'Windows';
    return 'Network OS';
}

// ─── HTTP Header Fingerprinting ───
async function grabHTTPInfo(ip, port = 80) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        let data = '';
        socket.on('connect', () => {
            socket.write(`GET / HTTP/1.0\r\nHost: ${ip}\r\nUser-Agent: NetSight/1.0\r\nConnection: close\r\n\r\n`);
        });
        socket.on('data', (chunk) => {
            data += chunk.toString();
            if (data.length > 4000) socket.destroy();
        });
        socket.on('close', () => { resolve(parseHTTPResponse(data)); });
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
        socket.on('error', () => { socket.destroy(); resolve(null); });
        socket.connect(port, ip);
    });
}

function parseHTTPResponse(raw) {
    if (!raw) return null;
    try {
        const headerEnd = raw.indexOf('\r\n\r\n');
        const headers = raw.substring(0, headerEnd > 0 ? headerEnd : 2000);
        const serverMatch = headers.match(/^Server:\s*(.+)/mi);
        const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
        const poweredByMatch = headers.match(/^X-Powered-By:\s*(.+)/mi);
        return {
            server: serverMatch ? serverMatch[1].trim() : null,
            title: titleMatch ? titleMatch[1].trim() : null,
            poweredBy: poweredByMatch ? poweredByMatch[1].trim() : null,
        };
    } catch { return null; }
}

// ─── SSH Banner Grabbing ───
async function grabSSHBanner(ip) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        let data = '';
        socket.on('data', (chunk) => { data += chunk.toString(); socket.destroy(); });
        socket.on('close', () => { resolve(data.trim() || null); });
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
        socket.on('error', () => { socket.destroy(); resolve(null); });
        socket.connect(22, ip);
    });
}

// ─── Combined OS & Device Category Detection ───
function detectOS(fingerprint) {
    const { ttl, sshBanner, httpInfo, vendor, snmpData, openPorts, hostname } = fingerprint;
    const portNumbers = (openPorts || []).map(p => p.port);
    const v = (vendor || '').toLowerCase();
    const h = (hostname || '').toLowerCase();

    let detectedOS = '';
    let osVersion = '';
    let deviceCategory = '';

    // 1. SNMP sysDescr — highest confidence
    if (snmpData && snmpData.sysDescr) {
        const d = snmpData.sysDescr;
        if (/cisco ios/i.test(d)) { detectedOS = 'Cisco IOS'; deviceCategory = 'Network'; }
        else if (/routeros/i.test(d)) { detectedOS = 'MikroTik RouterOS'; deviceCategory = 'Network'; }
        else if (/junos/i.test(d)) { detectedOS = 'Juniper JunOS'; deviceCategory = 'Network'; }
        else if (/linux/i.test(d)) detectedOS = 'Linux';
        else if (/windows/i.test(d)) detectedOS = 'Windows';
        else if (/freebsd/i.test(d)) detectedOS = 'FreeBSD';
        const versionMatch = d.match(/Version\s+([\d.()a-zA-Z]+)/i);
        if (versionMatch) osVersion = versionMatch[1];
    }

    // 2. SSH banner analysis
    if (sshBanner && !detectedOS) {
        if (/ubuntu/i.test(sshBanner)) detectedOS = 'Ubuntu Linux';
        else if (/debian/i.test(sshBanner)) detectedOS = 'Debian Linux';
        else if (/openssh/i.test(sshBanner)) detectedOS = 'Linux';
        else if (/dropbear/i.test(sshBanner)) { detectedOS = 'Linux (Embedded)'; deviceCategory = 'IoT'; }
        else if (/mikrotik/i.test(sshBanner)) { detectedOS = 'MikroTik RouterOS'; deviceCategory = 'Network'; }
        else if (/cisco/i.test(sshBanner)) { detectedOS = 'Cisco IOS'; deviceCategory = 'Network'; }
        const sshVer = sshBanner.match(/OpenSSH[_\s]+([\d.]+)/i);
        if (sshVer && !osVersion) osVersion = `SSH ${sshVer[1]}`;
    }

    // 3. HTTP header analysis
    if (httpInfo) {
        if (httpInfo.server) {
            const srv = httpInfo.server;
            if (/microsoft|iis/i.test(srv) && !detectedOS) detectedOS = 'Windows Server';
            else if (/apache/i.test(srv) && !detectedOS) detectedOS = 'Linux';
            else if (/nginx/i.test(srv) && !detectedOS) detectedOS = 'Linux';
            else if (/mikrotik/i.test(srv)) { detectedOS = 'MikroTik RouterOS'; deviceCategory = 'Network'; }
            else if (/tp-link|d-link|netgear/i.test(srv)) deviceCategory = 'Network';
            const iisVer = srv.match(/IIS\/([\d.]+)/i);
            if (iisVer && !osVersion) osVersion = `IIS ${iisVer[1]}`;
        }
        if (httpInfo.title) {
            const title = httpInfo.title;
            if (/synology|qnap|nas/i.test(title)) { detectedOS = detectedOS || 'Linux (NAS)'; deviceCategory = 'Server'; }
            else if (/proxmox|esxi|vcenter|vmware/i.test(title)) { deviceCategory = 'Server'; }
            else if (/printer|laserjet|imagerunner/i.test(title)) { deviceCategory = 'Printer'; }
            else if (/router|gateway/i.test(title)) deviceCategory = 'Network';
            else if (/switch/i.test(title)) deviceCategory = 'Network';
        }
    }

    // 4. TTL-based fallback
    if (!detectedOS && ttl > 0) {
        detectedOS = guessOSFromTTL(ttl);
    }

    // 5. Vendor-based device category
    if (!deviceCategory) {
        if (/apple/i.test(v)) {
            if (portNumbers.includes(62078)) { deviceCategory = 'Mobile'; detectedOS = detectedOS || 'iOS'; }
            else { deviceCategory = 'PC'; detectedOS = detectedOS || 'macOS'; }
        } else if (/samsung|xiaomi|huawei|oneplus|oppo|vivo|realme|motorola|google|pixel/i.test(v)) {
            deviceCategory = 'Mobile';
            if (detectedOS === 'Linux/Unix') detectedOS = 'Android';
            else if (!detectedOS) detectedOS = 'Android';
        } else if (portNumbers.includes(62078)) {
            deviceCategory = 'Mobile'; detectedOS = detectedOS || 'iOS';
        } else if (portNumbers.includes(3389)) {
            deviceCategory = 'PC'; detectedOS = detectedOS || 'Windows';
        } else if (portNumbers.includes(445) || portNumbers.includes(139)) {
            detectedOS = detectedOS || 'Windows';
            deviceCategory = portNumbers.includes(22) ? 'Server' : 'PC';
        } else if (portNumbers.includes(22) && (portNumbers.includes(80) || portNumbers.includes(443))) {
            deviceCategory = 'Server';
        }
    }

    // 6. TTL-based category refinement
    if (!deviceCategory && ttl > 0) {
        const ttlOS = guessOSFromTTL(ttl);
        if (ttlOS === 'Windows') {
            deviceCategory = 'PC';
        } else if (ttlOS === 'Network OS') {
            deviceCategory = 'Network';
        } else if (ttlOS === 'Embedded/IoT') {
            deviceCategory = 'IoT';
        }
    }

    return { os: detectedOS || 'Unknown', osVersion, deviceCategory: deviceCategory || 'Unknown' };
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
    const { ip = '', openPorts = [], vendor = '', hostname = '', isGateway = false, snmpData = null, ttl = 0, osInfo = null } = device;
    const portNumbers = openPorts.map(p => p.port);
    const v = (vendor || '').toLowerCase();
    const h = (hostname || '').toLowerCase();

    // --- Explicit gateway → Router ---
    if (isGateway) return 'Router';

    // --- IP .1 or .254 → almost always a router ---
    if (ip.endsWith('.1') || ip.endsWith('.254')) return 'Router';

    // --- SNMP sysDescr-based detection (highest confidence) ---
    if (snmpData && snmpData.sysDescr) {
        const desc = snmpData.sysDescr.toLowerCase();
        if (/switch|catalyst|procurve|powerconnect|nexus\s*[0-9]|sg[0-9]|gs[0-9]|tl-sg|dgs-|jl[0-9]|2960|3750|3850|9200|9300/.test(desc)) return 'Switch';
        // Only classify as Router from sysDescr if it's a definitive router OS
        // OR the device also serves DNS (port 53) — prevents switches with "router" in firmware text
        if (/routeros/.test(desc)) return 'Router';  // MikroTik RouterOS is definitively a router
        if (/router|ios.*isr|asr[0-9]|mikrotik/.test(desc) && !(/switch/.test(desc)) && portNumbers.includes(53)) return 'Router';
        if (/access.?point|wireless.*controller|wlc|capwap/.test(desc)) return 'Access Point';
        if (/firewall|fortigate|panos|fortiswitch/.test(desc)) return 'Firewall';
        if (/printer|laserjet|imagerunner|pixma/.test(desc)) return 'Printer';
        // sysDescr present but no definitive match → fall through to SNMP-responds check below
    }

    // --- SNMP responds but no sysDescr match → managed infrastructure ---
    if (snmpData && snmpData.responds) {
        const hasUserPorts = portNumbers.includes(3389) || portNumbers.includes(445) || portNumbers.includes(62078);
        if (!hasUserPorts) {
            if (portNumbers.includes(53)) return 'Router';
            // Device responds to SNMP + no end-user services = managed switch
            return 'Switch';
        }
    }

    // --- Hostname-based early detection ---
    if (/switch|sw[\d-]|catalyst|procurve|aruba.*switch/i.test(h)) return 'Switch';
    if (/router|gateway|gw[\d-]/i.test(h)) return 'Router';
    if (h.includes('printer') || h.includes('epson') || h.includes('canon')) return 'Printer';
    if (h.includes('firewall') || h.includes('fw')) return 'Firewall';
    if (/\bap\b|access.?point|unifi/i.test(h)) return 'Access Point';
    if (h.includes('server') || h.includes('nas') || h.includes('storage')) return 'Server';

    // --- Firewall vendors (before network vendors) ---
    if (/fortinet|paloalto|sonicwall|watchguard|sophos|checkpoint/.test(v)) return 'Firewall';

    // --- Access Point vendors ---
    if (/ruckus|aruba|meraki/.test(v) && !isGateway) return 'Access Point';
    if (/ubiquiti|unifi/.test(v)) {
        if (portNumbers.includes(8443) && !portNumbers.includes(53)) return 'Switch';
        if (!isGateway) return 'Access Point';
    }

    // --- Printer detection ---
    if (portNumbers.includes(631) || portNumbers.includes(9100)) return 'Printer';
    if (/epson|brother|canon|lexmark|xerox/.test(v) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Printer';

    // --- Network vendor: distinguish Router vs Switch ---
    const isNetworkVendor = /cisco|linksys|mikrotik|juniper|netgear|d-link|tp-link|asus|belkin|arcadyan|technicolor|sagemcom|huawei|zte|arista|extreme|brocade|allied.?telesis|h3c|hpe|avaya/.test(v);
    if (isNetworkVendor) {
        const hasDNS = portNumbers.includes(53);
        const hasSNMP = portNumbers.includes(161);
        const hasTelnet = portNumbers.includes(23);
        const hasHTTP = portNumbers.includes(80) || portNumbers.includes(443);
        const hasSSH = portNumbers.includes(22);
        const hasMikroTik = portNumbers.includes(8291) || portNumbers.includes(8728);
        const hasCiscoSI = portNumbers.includes(4786);
        const hasNETCONF = portNumbers.includes(830);
        const hasRDP = portNumbers.includes(3389);
        const hasSMB = portNumbers.includes(445);

        if (hasDNS) return 'Router';
        if (hasMikroTik && hasDNS) return 'Router';
        if (hasMikroTik && !hasDNS) return 'Switch';
        if (hasCiscoSI) return 'Switch';
        if (hasNETCONF && !hasDNS) return 'Switch';
        if (hasSNMP && (hasHTTP || hasTelnet || hasSSH) && !hasDNS && !hasRDP && !hasSMB) return 'Switch';
        if ((hasHTTP || hasTelnet) && !hasDNS && !hasRDP && !hasSMB && portNumbers.length <= 5) return 'Switch';
        if (hasTelnet || hasSSH || hasHTTP) return 'Router';
        return 'Switch';
    }

    // --- DNS server (non-network vendor) → Router ---
    if (portNumbers.includes(53)) return 'Router';

    // --- Mobile/consumer devices ---
    if (/apple|samsung|xiaomi|huawei|oneplus|oppo|vivo|realme|motorola|google|pixel/.test(v)) return 'Workstation';
    if (portNumbers.includes(62078)) return 'Workstation';

    // --- Server detection ---
    if (portNumbers.includes(22) && (portNumbers.includes(80) || portNumbers.includes(443))) return 'Server';
    if (/vmware|virtualbox|qemu|kvm|hyper-v|parallels/.test(v)) return 'Server';
    if (/dell|super micro/.test(v) && portNumbers.includes(22)) return 'Server';

    // --- Workstation detection ---
    if (portNumbers.includes(3389) || portNumbers.includes(445)) return 'Workstation';
    if (/hp|dell|lenovo|acer|microsoft/.test(v)) return 'Workstation';

    // --- Unknown device with TCP SNMP + management but no user ports → Switch ---
    if (portNumbers.includes(161) && (portNumbers.includes(80) || portNumbers.includes(23)) && !portNumbers.includes(53) && !portNumbers.includes(3389) && !portNumbers.includes(445)) return 'Switch';

    // Port 80 only devices fall through to TTL-based detection below

    // --- TTL-based fallback: use OS fingerprint to avoid "Other" ---
    if (ttl > 0) {
        const ttlOS = guessOSFromTTL(ttl);
        if (ttlOS === 'Windows') return 'Workstation';          // Windows PC with firewall
        if (ttlOS === 'Network OS') return 'Router';             // TTL 255 = network equipment
        if (ttlOS === 'Embedded/IoT') return 'IoT';              // Very low TTL = IoT/embedded
        // Linux/Unix TTL~64: could be anything (server, mobile, IoT)
        if (ttlOS === 'Linux/Unix') {
            // Use osInfo from detectOS if available
            if (osInfo && /android/i.test(osInfo.os)) return 'Mobile';
            if (osInfo && /ios/i.test(osInfo.os)) return 'Mobile';
            if (osInfo && osInfo.deviceCategory === 'Mobile') return 'Mobile';
            if (osInfo && osInfo.deviceCategory === 'Server') return 'Server';
            if (osInfo && osInfo.deviceCategory === 'IoT') return 'IoT';
            return 'Workstation';  // Default Linux/Mac device → Workstation
        }
    }

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
    const maxIPs = Math.min(end - start, 65536); // Support up to /16
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
        // Run native pings in parallel batches of 200 to avoid resource exhaustion
        for (let i = 0; i < ips.length; i += 200) {
            const pingBatch = ips.slice(i, i + 200);
            await Promise.all(pingBatch.map(ip =>
                runCommand(`ping -n 1 -w 200 ${ip}`).catch(() => null)
            ));
        }
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
    // Phase 1: Core probes (parallel)
    const [hostname, netbiosName, openPorts, snmpResult, ttl] = await Promise.all([
        reverseDNS(ip),
        getNetBIOSName(ip),
        scanCommonPorts(ip),
        snmpProbe(ip),
        getTTL(ip),
    ]);

    const portNumbers = openPorts.map(p => p.port);

    // Phase 2: Conditional probes based on open ports (parallel)
    const [httpInfo, sshBanner] = await Promise.all([
        portNumbers.includes(80) || portNumbers.includes(8080)
            ? grabHTTPInfo(ip, portNumbers.includes(80) ? 80 : 8080)
            : Promise.resolve(null),
        portNumbers.includes(22)
            ? grabSSHBanner(ip)
            : Promise.resolve(null),
    ]);

    const vendor = lookupVendor(mac);
    const isGateway = gateways.includes(ip);
    const resolvedName = netbiosName || hostname || '';

    // Detect OS and device category
    const osInfo = detectOS({ ttl, sshBanner, httpInfo, vendor, snmpData: snmpResult, openPorts, hostname: resolvedName });

    const deviceInfo = { ip, mac, hostname: resolvedName, openPorts, vendor, isGateway, snmpData: snmpResult, ttl, osInfo };
    const type = classifyDevice(deviceInfo);

    // Build a descriptive name
    let finalName = resolvedName;
    if (type === 'Router') {
        if (!finalName || finalName.toLowerCase().includes('reliance')) {
            finalName = vendor !== 'Unknown' ? `${vendor} Router` : 'Network Router';
        }
    } else if (type === 'Switch') {
        if (!finalName) {
            let switchLabel = '';
            if (snmpResult && snmpResult.sysDescr) {
                const descr = snmpResult.sysDescr;
                const modelMatch = descr.match(/(?:Catalyst|ProCurve|PowerConnect|Nexus|TL-SG|DGS-|GS[0-9]\S+|SG[0-9]\S+|C[0-9]{4}|[A-Z]{2,3}-?\d{3,4}\S*)/i);
                if (modelMatch) switchLabel = modelMatch[0];
            }
            if (switchLabel) {
                finalName = vendor !== 'Unknown' ? `${vendor} ${switchLabel}` : switchLabel;
            } else {
                finalName = vendor !== 'Unknown' ? `${vendor} Switch` : 'Network Switch';
            }
        }
    } else if (finalName === '' && vendor !== 'Unknown') {
        finalName = `${vendor} ${type}`;
    }

    const snmpTag = snmpResult.responds ? ' [SNMP]' : '';

    return {
        ip, mac, type, vendor, status: 'Online',
        hostname: finalName,
        openPorts: openPorts.map(p => ({ port: p.port, service: p.service })),
        isGateway,
        snmpDescr: snmpResult.sysDescr || null,
        // New fingerprinting data
        osInfo: osInfo.os,
        osVersion: osInfo.osVersion,
        deviceCategory: osInfo.deviceCategory,
        ttl,
        sshBanner: sshBanner ? sshBanner.substring(0, 100) : null,
        httpServer: httpInfo?.server || null,
    };
}

// ═══════════════════════════════════════════
// MAIN SCAN FUNCTION
// ═══════════════════════════════════════════

let isScanning = false;
let scanTimer = null;
let lastScanTime = null;
let scanStats = { devicesFound: 0, lastScanDuration: 0 };

// Scan a single CIDR subnet
async function scanSubnet(cidr, gateways, allLocalNets) {
    const selfInterface = allLocalNets.find(n => isIPInCIDR(n.ip, cidr));

    // Step 1: Ping sweep
    const ips = getIPsFromCIDR(cidr);
    logger.info(`Sweeping ${ips.length} addresses on ${cidr}...`, 'scanner');
    await pingSweep(ips);

    // Step 2: Read ARP table (filtered to this subnet)
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

    // Filter to only IPs in this CIDR
    const subnetDevices = arpDevices.filter(d => isIPInCIDR(d.ip, cidr));

    // Add self device if on this subnet
    if (selfInterface && !subnetDevices.find(d => d.ip === selfInterface.ip)) {
        subnetDevices.push({ ip: selfInterface.ip, mac: selfInterface.mac?.toUpperCase() || '00:00:00:00:00:00' });
    }

    // Add gateways that are on this subnet
    for (const gw of gateways) {
        if (isIPInCIDR(gw, cidr) && !subnetDevices.find(d => d.ip === gw)) {
            subnetDevices.push({ ip: gw, mac: '00:00:00:00:00:00' });
        }
    }

    logger.info(`Found ${subnetDevices.length} devices on ${cidr}`, 'scanner');
    return { subnetDevices, selfInterface };
}

// Scan all configured networks
async function scanNetwork(cidr) {
    if (isScanning) {
        logger.warn('Scan already in progress, skipping...', 'scanner');
        return null;
    }
    isScanning = true;
    const startTime = Date.now();

    try {
        // Step 1: Get gateways and all local interfaces
        const gateways = await getDefaultGateway();
        const localNets = getLocalNetworkInfo();

        logger.info(`Gateways: ${gateways.join(', ') || 'none'}`, 'scanner');

        // Step 2: Build list of all subnets to scan
        // Skip virtual adapters (VMware, Hyper-V, VirtualBox, Docker, WSL)
        const skipPatterns = /docker|wsl|loopback|veth[0-9]|br-[0-9a-f]|vmware|vmnet|hyper-v|vethernet|virtualbox|vbox/i;
        const cidrsToScan = new Set();

        // Always include the primary configured CIDR
        cidrsToScan.add(cidr);

        // Auto-detect additional subnets from local interfaces
        logger.info(`Detected ${localNets.length} interfaces: ${localNets.map(i => i.name + '(' + i.ip + ')').join(', ')}`, 'scanner');
        for (const iface of localNets) {
            // Skip Docker/WSL interfaces only
            if (skipPatterns.test(iface.name)) continue;
            // Skip loopback
            if (iface.ip === '127.0.0.1' || iface.ip.startsWith('169.254.')) continue;

            const parts = iface.ip.split('.');
            const ifaceCidr = parts.slice(0, 3).join('.') + '.0/24';
            cidrsToScan.add(ifaceCidr);
        }

        const allCidrs = [...cidrsToScan];
        if (allCidrs.length > 1) {
            logger.info(`Multi-subnet scan: ${allCidrs.join(', ')}`, 'scanner');
        } else {
            logger.info(`Starting network scan on ${cidr}...`, 'scanner');
        }

        // Step 3: Scan each subnet
        const allDevices = [];
        const seenIPs = new Set();
        let selfInterface = null;

        for (const subnet of allCidrs) {
            const result = await scanSubnet(subnet, gateways, localNets);
            if (result.selfInterface) selfInterface = result.selfInterface;

            // Merge, avoiding duplicates
            for (const dev of result.subnetDevices) {
                if (!seenIPs.has(dev.ip)) {
                    seenIPs.add(dev.ip);
                    allDevices.push(dev);
                }
            }
        }

        logger.info(`Total: ${allDevices.length} devices across ${allCidrs.length} subnet(s)`, 'scanner');

        // Step 4: Deep probe each device
        logger.info(`Deep probing ${allDevices.length} devices...`, 'scanner');
        const enrichedDevices = [];
        const PROBE_BATCH = 10;
        for (let i = 0; i < allDevices.length; i += PROBE_BATCH) {
            const batch = allDevices.slice(i, i + PROBE_BATCH);
            const results = await Promise.all(
                batch.map(async (d) => {
                    const result = await probeDevice(d.ip, d.mac, gateways);
                    if (selfInterface && d.ip === selfInterface.ip) {
                        result.hostname = result.hostname || os.hostname();
                        result.type = 'Workstation';
                        result.isSelf = true;
                    }
                    const snmpTag = result.snmpDescr ? ' [SNMP]' : '';
                    const osTag = result.osInfo && result.osInfo !== 'Unknown' ? ` (${result.osInfo})` : '';
                    logger.info(`${d.ip} → ${result.type} | ${result.vendor} | "${result.hostname}"${snmpTag}${osTag}`, 'scanner');
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

        logger.success(`Scan complete: ${enrichedDevices.length} devices found across ${allCidrs.length} subnet(s) in ${duration}s`, 'scanner');

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
