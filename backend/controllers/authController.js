const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { logActivity } = require('./auditController');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
        res.status(400);
        throw new Error('Please add all fields including organization name');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user with organization and admin role
    const user = await User.create({
        name,
        email,
        password,
        organization: organizationName,
        role: 'admin',
        otp,
        otpExpires
    });

    if (user) {
        // Log successful registration
        await logActivity({
            req,
            action: 'Register Admin',
            target: user.email,
            result: 'Success',
            organization: user.organization
        });

        // Send verification email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification OTP',
                html: `
<div style="background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; font-family: Arial, sans-serif; text-align: center;">
    <h1 style="color: #d4af37; margin-bottom: 20px; font-size: 32px;">NetSight</h1>
    <h2 style="color: #ffffff; margin-bottom: 20px;">Welcome to NetSight!</h2>
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto 30px auto;">
        Please verify your email address to complete your registration. Your verification code is:
    </p>
    <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${otp}</span>
    </div>
    <p style="color: #666666; font-size: 14px;">
        If you did not request this, please ignore this email.
    </p>
</div>`
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful. Verification OTP sent to your email.'
            });
        } catch (err) {
            console.error('Email send error:', err);
            res.status(201).json({
                success: true,
                message: 'Registration successful, but email could not be sent. Please request a new OTP.'
            });
        }
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your email to login');
        }

        if (user.isActive === false) {
            res.status(403);
            throw new Error('Your account has been deactivated. Please contact your administrator.');
        }

        // Log successful login
        await logActivity({
            req,
            action: 'Login',
            target: 'Authentication',
            result: 'Success',
            organization: user.organization
        });

        res.json({
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
        // Log failed login
        await logActivity({
            req,
            action: 'Login Attempt',
            target: email || 'Unknown',
            result: 'Failed'
        });

        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Verify Email OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ 
        email,
        otp,
        otpExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Email verified successfully'
    });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(404);
        throw new Error('User not found with that email');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash Token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset OTP',
            html: `
<div style="background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; font-family: Arial, sans-serif; text-align: center;">
    <h1 style="color: #d4af37; margin-bottom: 20px; font-size: 32px;">NetSight</h1>
    <h2 style="color: #ffffff; margin-bottom: 20px;">Password Reset Request</h2>
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto 30px auto;">
        You are receiving this email because you (or someone else) requested a password reset. Use the following verification code to reset your password. It is valid for 10 minutes.
    </p>
    <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${otp}</span>
    </div>
    <p style="color: #666666; font-size: 14px;">
        If you did not request this, please ignore this email.
    </p>
</div>`
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Verify Reset Password OTP
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and otp');
    }

    // Get hashed otp
    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    const user = await User.findOne({
        email,
        resetPasswordToken: hashedOtp,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    res.status(200).json({
        success: true,
        message: 'OTP is valid'
    });
});

// @desc    Reset Password
// @route   POST /api/v1/auth/resetpassword
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        res.status(400);
        throw new Error('Please provide email, otp, and new password');
    }

    // Get hashed token
    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    const user = await User.findOne({
        email,
        resetPasswordToken: hashedOtp,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful',
        token: generateToken(user._id)
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    verifyOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword
};

