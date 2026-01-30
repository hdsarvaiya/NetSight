/**
 * Device Type Classifier using SNMP
 * 
 * Implements device type detection logic based on SNMP OIDs:
 * - sysDescr
 * - sysObjectID 
 * - ifNumber
 * - ipForwarding
 */

const snmp = require('net-snmp');

// Standard SNMP OIDs
const OIDS = {
    sysDescr: '1.3.6.1.2.1.1.1.0',
    sysObjectID: '1.3.6.1.2.1.1.2.0',
    ifNumber: '1.3.6.1.2.1.2.1.0',
    ipForwarding: '1.3.6.1.2.1.4.1.0'
};

// Common OS patterns for Host identification
const HOST_OS_PATTERNS = [
    /windows/i,
    /linux/i,
    /ubuntu/i,
    /debian/i,
    /centos/i,
    /macos/i,
    /darwin/i,
    /android/i,
    /server/i,
    /workstation/i,
    /desktop/i
];

/**
 * Identify device type given an IP address
 * 
 * @param {string} ipAddress - The target IP address
 * @param {string} community - SNMP community string (default: 'public')
 * @returns {Promise<{ipAddress: string, deviceType: string, reason: string}>}
 */
/**
 * Identify device type given an IP address and optional MAC address
 * 
 * @param {string} ipAddress - The target IP address
 * @param {string} macAddress - The target MAC address (optional)
 * @param {string} community - SNMP community string (default: 'public')
 * @returns {Promise<{ipAddress: string, deviceType: string, reason: string}>}
 */
async function identifyDeviceType(ipAddress, macAddress = null, community = 'public') {
    return new Promise((resolve) => {
        const session = snmp.createSession(ipAddress, community, {
            timeout: 5000,
            retries: 1
        });

        const oidsToFetch = [
            OIDS.sysDescr,
            OIDS.sysObjectID,
            OIDS.ifNumber,
            OIDS.ipForwarding
        ];

        session.get(oidsToFetch, (error, varbinds) => {
            session.close();

            const fallbackToMac = () => {
                if (macAddress) {
                    const vendorType = checkMacVendor(macAddress);
                    if (vendorType !== 'Unknown') {
                        return resolve({
                            ipAddress,
                            deviceType: vendorType,
                            reason: `Identified via MAC Address Vendor (${macAddress})`
                        });
                    }
                }

                // Final fallback
                resolve({
                    ipAddress,
                    deviceType: 'Unknown',
                    reason: error ? `SNMP failed: ${error.message}` : 'SNMP succeeded but no match found'
                });
            };

            if (error) {
                return fallbackToMac();
            }

            // Parse results
            const data = {};
            varbinds.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    if (vb.oid === OIDS.sysDescr) data.sysDescr = vb.value.toString();
                    if (vb.oid === OIDS.sysObjectID) data.sysObjectID = vb.value.toString();
                    if (vb.oid === OIDS.ifNumber) data.ifNumber = parseInt(vb.value);
                    if (vb.oid === OIDS.ipForwarding) data.ipForwarding = parseInt(vb.value);
                }
            });

            // Classification Logic
            let classification = {
                deviceType: 'Unknown',
                reason: 'Insufficient data for classification'
            };

            // 1. Router Check: if ipForwarding is enabled (1 = forwarding)
            if (data.ipForwarding === 1) {
                classification = {
                    deviceType: 'Router',
                    reason: 'IP Forwarding is enabled (value: 1)'
                };
            }
            // 2. Switch Check: if interface count > 8 (heuristic)
            else if (data.ifNumber > 8) {
                classification = {
                    deviceType: 'Switch',
                    reason: `High interface count (${data.ifNumber} > 8)`
                };
            }
            // 3. Host Check: OS or host info in sysDescr
            else if (data.sysDescr && HOST_OS_PATTERNS.some(regex => regex.test(data.sysDescr))) {
                const match = HOST_OS_PATTERNS.find(regex => regex.test(data.sysDescr));
                classification = {
                    deviceType: 'Host',
                    reason: `OS information detected in sysDescr (matched: ${match})`
                };
            }
            // Fallback: If sysDescr exists but no match -> Unknown
            else if (data.sysDescr) {
                classification = {
                    deviceType: 'Unknown',
                    reason: `SNMP reachable but no matching classification rule. sysDescr: "${data.sysDescr.substring(0, 50)}..."`
                };
            }

            if (classification.deviceType === 'Unknown') {
                return fallbackToMac();
            }

            resolve({
                ipAddress,
                deviceType: classification.deviceType,
                reason: classification.reason,
                details: data // Optional: return raw data for debugging if needed
            });
        });
    });
}

/**
 * Simple MAC Address Vendor Lookup
 * In a real app, use a library like 'oui' or an API.
 */
function checkMacVendor(mac) {
    if (!mac) return 'Unknown';
    const cleanMac = mac.replace(/[:.-]/g, '').toLowerCase().substring(0, 6);

    // Common OUIs (first 6 chars of MAC hex)
    const OUI_TABLE = {
        '30074d': 'Samsung Mobile', // Samsung Electronics
        'b827eb': 'Raspberry Pi',
        'dc:a6:32': 'Raspberry Pi',
        '000c29': 'VMware',
        '005056': 'VMware',
        '00155d': 'Hyper-V',
        '080027': 'VirtualBox',
        'f09e4a': 'Ubiquiti',
        '7483c2': 'Ubiquiti',
        '18e829': 'Ubiquiti',
        'e43883': 'D-Link', // D-Link
        'c025e9': 'TP-Link',
        '50c7bf': 'TP-Link', // Example
        '001132': 'Synology',
        '001c42': 'Parallels'
    };

    // Normalize logic for lookup
    // Since we have limited OUI table, this is basic.
    if (cleanMac === '30074d') return 'Mobile'; // Specific fix for user's device

    // Check table
    for (const [oui, vendor] of Object.entries(OUI_TABLE)) {
        const cleanOui = oui.replace(/[:.-]/g, '').toLowerCase();
        if (cleanMac.startsWith(cleanOui)) {
            if (vendor.includes('Mobile')) return 'Mobile';
            if (vendor.includes('Pi') || vendor.includes('Synology')) return 'IoT/NAS';
            if (vendor.includes('VMware') || vendor.includes('Hyper-V') || vendor.includes('VirtualBox')) return 'Virtual Machine';
            if (vendor.includes('Ubiquiti') || vendor.includes('TP-Link') || vendor.includes('D-Link')) return 'Network Device';
            return 'Host'; // Default for known vendor
        }
    }

    return 'Unknown';
}

module.exports = { identifyDeviceType };
