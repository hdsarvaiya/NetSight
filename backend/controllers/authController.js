const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, organizationName, role } = req.body;
    console.log('[DEBUG] Register hit:', email);

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user',
        otp,
        otpExpires
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid user data');
    }

    // Always log OTP to console
    console.log('\n========================================');
    console.log(`  OTP for ${email}: ${otp}`);
    console.log('========================================\n');

    // Try email (non-blocking)
    try {
        await sendEmail({
            email: user.email,
            subject: 'NetSight - Verify Your Email',
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="500" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#d4af37,#b8860b);padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:1px;">⚡ NetSight</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Network Monitoring & Intelligence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:600;">Verify Your Email</h2>
              <p style="margin:0 0 30px;color:#9ca3af;font-size:14px;line-height:1.6;">
                Hi <strong style="color:#ffffff;">${user.name}</strong>, use the code below to verify your email address and activate your account.
              </p>
              <!-- OTP Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background-color:#2a2a2a;border:2px solid #d4af37;border-radius:12px;padding:24px 40px;display:inline-block;">
                      <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#d4af37;font-family:'Courier New',monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;text-align:center;">
                ⏱ This code expires in <strong style="color:#9ca3af;">10 minutes</strong>
              </p>
              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:30px 0;">
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                If you didn't create an account with NetSight, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#111111;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#4b5563;font-size:11px;">
                © ${new Date().getFullYear()} NetSight. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
        });
    } catch (error) {
        console.error('Email send failed (use OTP from console above)');
    }

    res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        message: 'Registration successful. Please verify your email.'
    });
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    console.log('[DEBUG] Verify OTP hit:', email, 'OTP entered:', otp);

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and OTP');
    }

    const user = await User.findOne({ email });
    console.log('[DEBUG] User found:', !!user, 'Stored OTP:', user?.otp, 'Entered OTP:', otp);

    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        return res.json({
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: true
            },
            tokens: { accessToken: generateToken(user._id) }
        });
    }

    if (String(user.otp) !== String(otp)) {
        console.log('[DEBUG] OTP mismatch! DB:', user.otp, 'Input:', otp);
        res.status(400);
        throw new Error('Invalid OTP');
    }

    if (user.otpExpires < Date.now()) {
        res.status(400);
        throw new Error('OTP expired');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
        user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: true
        },
        tokens: { accessToken: generateToken(user._id) }
    });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your email first');
        }

        res.json({
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            tokens: { accessToken: generateToken(user._id) }
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    verifyOtp
};
