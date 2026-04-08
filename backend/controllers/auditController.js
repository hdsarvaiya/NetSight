const asyncHandler = require('express-async-handler');
const Audit = require('../models/auditModel');

// @desc    Get all audit logs filtered by organization
// @route   GET /api/v1/audit
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
    const { searchQuery, userFilter, resultFilter, page = 1, limit = 10 } = req.query;
    
    // Base filter for organization isolation
    const query = { organization: req.user.organization };

    if (searchQuery) {
        query.$or = [
            { action: { $regex: searchQuery, $options: 'i' } },
            { target: { $regex: searchQuery, $options: 'i' } },
            { userName: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    if (userFilter && userFilter !== 'all') {
        query.userName = userFilter;
    }

    if (resultFilter && resultFilter !== 'all') {
        query.result = resultFilter;
    }

    const count = await Audit.countDocuments(query);
    const logs = await Audit.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.json({
        success: true,
        count: logs.length,
        totalLogs: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
        logs
    });
});

/**
 * Utility helper to simplify logging across other controllers
 */
const logActivity = async ({ req, action, target, result = 'Success', ip, organization }) => {
    try {
        // Fallbacks for unauthenticated/anonymous actions
        const userId = req.user?._id || '000000000000000000000000';
        const userName = req.user?.name || 'System / Anonymous';
        const org = organization || req.user?.organization || 'Unknown / System';

        // Detect and clean IP address
        let detectedIp = ip || req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        if (detectedIp === '::1' || detectedIp === '127.0.0.1') {
            detectedIp = 'Internal / Local';
        }

        await Audit.create({
            user: userId,
            userName: userName,
            organization: org,
            action,
            target,
            result,
            ip: detectedIp
        });
    } catch (error) {
        console.error('[AUDIT] Failed to create log:', error.message);
    }
};

// @desc    Export audit logs to CSV
// @route   GET /api/v1/audit/export
// @access  Private/Admin
const exportAuditLogs = asyncHandler(async (req, res) => {
    const { searchQuery, userFilter, resultFilter } = req.query;
    
    // Base filter for organization isolation
    const query = { organization: req.user.organization };

    if (searchQuery) {
        query.$or = [
            { action: { $regex: searchQuery, $options: 'i' } },
            { target: { $regex: searchQuery, $options: 'i' } },
            { userName: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    if (userFilter && userFilter !== 'all') {
        query.userName = userFilter;
    }

    if (resultFilter && resultFilter !== 'all') {
        query.result = resultFilter;
    }

    const logs = await Audit.find(query).sort({ createdAt: -1 });

    if (req.query.format === 'json') {
        return res.status(200).json({ success: true, logs });
    }

    // Build CSV
    const fields = ['Timestamp', 'User', 'Action', 'Target', 'Result', 'IP Address'];
    const csvRows = [fields.join(',')];

    logs.forEach(log => {
        const row = [
            `"${new Date(log.createdAt).toLocaleString()}"`,
            `"${log.userName}"`,
            `"${log.action}"`,
            `"${log.target}"`,
            `"${log.result}"`,
            `"${log.ip}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.status(200).send(csvString);
});

module.exports = {
    getAuditLogs,
    exportAuditLogs,
    logActivity
};

