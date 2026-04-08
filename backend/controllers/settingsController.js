const asyncHandler = require('express-async-handler');
const Settings = require('../models/settingsModel');
const { logActivity } = require('./auditController');

// @desc    Get user settings
// @route   GET /api/v1/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({ user: req.user.id });

    // If settings don't exist for the user yet, create defaults
    if (!settings) {
        settings = await Settings.create({ user: req.user.id });
    }

    res.status(200).json(settings);
});

// @desc    Update user settings
// @route   PUT /api/v1/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({ user: req.user.id });

    if (!settings) {
        settings = await Settings.create({ user: req.user.id, ...req.body });
    } else {
        settings = await Settings.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
    }

    // Log the activity
    await logActivity({
        req,
        action: 'Update Settings',
        target: 'System Settings',
        result: 'Success',
        organization: req.user.organization
    });

    res.status(200).json(settings);
});

module.exports = {
    getSettings,
    updateSettings
};
