const Alert = require('../models/alertModel');
const socketIO = require('./socket');

/**
 * Check device metrics against alert thresholds and create/deduplicate alerts.
 * Shared between the local monitoring agent and the remote agent API handler.
 *
 * @param {Object} device - Device document from DB (must have _id, user, organization, name/hostname/ip)
 * @param {Object} metrics - { status, latency, packetLoss, cpuUsage, memoryUsage }
 * @param {Object} userSettings - User's alert threshold settings
 */
async function checkAlerts(device, metrics, userSettings) {
    const alerts = [];

    const latencyWarning = userSettings?.latencyThreshold ?? 50;
    const packetLossWarning = userSettings?.packetLossThreshold ?? 1;
    const cpuWarning = userSettings?.cpuThreshold ?? 80;
    const memoryWarning = userSettings?.memoryThreshold ?? 85;

    if (metrics.status === 'Offline') {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'AVAILABILITY',
            metric: 'status',
            metric_value: 0,
            threshold_value: 1,
            severity: 'critical',
            message: `Device is unreachable (ping failed)`,
        });
    }

    if (metrics.latency > latencyWarning && metrics.status === 'Online') {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'latency',
            metric_value: metrics.latency,
            threshold_value: latencyWarning,
            severity: 'warning',
            message: `High latency detected: ${metrics.latency}ms`,
        });
    }

    if (metrics.packetLoss > packetLossWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'packetLoss',
            metric_value: metrics.packetLoss,
            threshold_value: packetLossWarning,
            severity: 'warning',
            message: `High packet loss: ${metrics.packetLoss}%`,
        });
    }

    if (metrics.cpuUsage > cpuWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'cpuUsage',
            metric_value: metrics.cpuUsage,
            threshold_value: cpuWarning,
            severity: 'warning',
            message: `CPU usage above ${cpuWarning}%: ${metrics.cpuUsage}%`,
        });
    }

    if (metrics.memoryUsage > memoryWarning) {
        alerts.push({
            user: device.user,
            organization: device.organization,
            device: device._id,
            deviceName: device.name || device.hostname || device.ip,
            deviceIp: device.ip,
            alert_type: 'PERFORMANCE',
            metric: 'memoryUsage',
            metric_value: metrics.memoryUsage,
            threshold_value: memoryWarning,
            severity: 'warning',
            message: `Memory usage above ${memoryWarning}%: ${metrics.memoryUsage}%`,
        });
    }

    // Enterprise Deduplication & Creation
    for (const alert of alerts) {
        // Try to find an identical alert that is still active (NEW or ACKNOWLEDGED)
        let activeAlert = await Alert.findOne({
            device: alert.device,
            metric: alert.metric,
            status: { $in: ['NEW', 'ACKNOWLEDGED'] }
        });

        const io = socketIO.getIO();

        if (activeAlert) {
            // Deduplicate: increment count and touch timestamp without creating a new row
            activeAlert.duplicate_count += 1;
            activeAlert.updatedAt = new Date();
            activeAlert.metric_value = alert.metric_value;
            await activeAlert.save();

            // Only broadcast every 5th duplicate to save bandwidth
            if (io && activeAlert.duplicate_count % 5 === 0) {
                io.emit('alert_updated', { action: 'DUPLICATE_UPDATED', data: activeAlert });
            }
        } else {
            // Create brand new alert
            const newAlert = await Alert.create(alert);

            // Broadcast over websockets for real-time notification
            if (io) {
                io.emit('alert_updated', { action: 'CREATED', data: newAlert });
            }
        }
    }
}

module.exports = { checkAlerts };
