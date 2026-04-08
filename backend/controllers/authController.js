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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user has been added by the organization
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User is not added by the organization', { cause: 'unauthorized' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user details
    user.name = name;
    user.password = password;
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.isVerified = false; // Reset verification status for the new password

    await user.save();

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
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #2a2a2a;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">NetSight</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin-top: 0; margin-bottom: 24px; font-size: 20px; font-weight: 500;">Email Verification OTP</h2>
              <p style="color: #d1d5db; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                Welcome to NetSight! To complete your registration and secure your account, please use the verification code below.
              </p>
              <div style="background-color: #0a0a0a; border: 1px dashed #d4af37; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <span style="display: block; font-size: 14px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</span>
                <span style="font-size: 36px; font-weight: 700; color: #d4af37; letter-spacing: 4px;">${otp}</span>
              </div>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                This code will expire in 10 minutes. If you did not request this verification, please safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #0f0f0f; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; text-align: center; border-top: 1px solid #2a2a2a;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} NetSight. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

            await sendEmail({
                email: user.email,
                subject: 'Email Verification OTP - NetSight',
                html: emailHtml
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

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash Token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            html: `<h1>Password Reset Request</h1><p>${message}</p>`
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

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid reset token');
    }

    // Set new password
    user.password = req.body.password;
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
    resetPassword
};

