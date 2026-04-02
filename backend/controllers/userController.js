const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
        res.status(400);
        throw new Error('Please add all fields including organization name');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        organization: organizationName,
        role: 'admin', // Force first registration to be admin
    });

    if (user) {
        res.status(201).json({
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                setupCompleted: user.setupCompleted
            },
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    if (!req.user.organization) {
        return res.status(200).json({
            success: true,
            count: 0,
            users: []
        });
    }

    const users = await User.find({ organization: req.user.organization }).select('-password');
    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// @desc    Create new user (by Admin)
// @route   POST /api/v1/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password: password || 'Welcome123!', // Default password for invited users
        role: role || 'user',
        isVerified: true,
        setupCompleted: true,
        organization: req.user.organization,
        createdBy: req.user._id
    });

    if (user) {
        res.status(201).json({
            success: true,
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Security Check: Ensure user belongs to the admin's organization
        if (user.organization !== req.user.organization && req.user.role !== 'superadmin') {
            res.status(403);
            throw new Error('Not authorized to update users from this organization');
        }

        user.name = req.body.name || user.name;
        user.role = req.body.role || user.role;
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

        const updatedUser = await user.save();

        res.json({
            success: true,
            user: {
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive
            }
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Security Check: Ensure user belongs to the admin's organization
        if (user.organization !== req.user.organization && req.user.role !== 'superadmin') {
            res.status(403);
            throw new Error('Not authorized to delete users from this organization');
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
