const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Send OTP email
const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send verification email');
  }
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate and send OTP
    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      email,
      password: hashedPassword,
      otp: {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
      }
    });

    await user.save();
    await sendOTP(email, otp);

    res.status(201).json({ 
      message: 'Registration successful. Please verify your email.',
      requiresOTP: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: 'No OTP requested' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified and remove OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ 
      message: 'Email verified successfully',
      user: {
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
      await user.save();
      await sendOTP(email, otp);

      return res.status(403).json({
        message: 'Email not verified',
        requiresOTP: true
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ 
      user: { 
        email: user.email,
        isVerified: user.isVerified 
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new route
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Update user's OTP
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    };
    
    await user.save();
    await sendOTP(email, otp);

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

module.exports = router;