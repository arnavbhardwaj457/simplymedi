const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Doctor } = require('../models');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get current user info (requires authentication)
router.get('/me', async (req, res) => {
  try {
    // This route should be protected by authentication middleware
    // but we'll handle it here for now
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'gender', 'isActive', 'subscription', 'createdAt']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Check if user is also a doctor
    const doctor = await Doctor.findOne({
      where: { userId: user.id },
      attributes: ['id', 'specialization', 'licenseNumber', 'experience', 'isActive']
    });

    res.json({
      user: user.getPublicProfile(),
      doctor: doctor ? doctor.getPublicProfile() : null
    });
  } catch (error) {
    logger.error('Get user info error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('phoneNumber').optional().isMobilePhone(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, dateOfBirth, phoneNumber, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      gender
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.getPublicProfile(),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: user.getPublicProfile(),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Register as doctor
router.post('/register-doctor', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email, password, firstName, lastName, dateOfBirth, phoneNumber, gender,
      licenseNumber, specialization, qualifications, experience, hospitalAffiliation,
      consultationFee, languages, bio
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user first
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      gender,
      subscription: 'doctor'
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      userId: user.id,
      licenseNumber,
      specialization,
      qualifications: Array.isArray(qualifications) ? qualifications : [qualifications],
      experience,
      hospitalAffiliation,
      consultationFee,
      languages: Array.isArray(languages) ? languages : [languages],
      bio
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info(`New doctor registered: ${email}`);

    res.status(201).json({
      message: 'Doctor registered successfully',
      user: user.getPublicProfile(),
      doctor: doctor.toJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Doctor registration error:', error);
    res.status(500).json({ error: 'Doctor registration failed' });
  }
});

// Verify email (placeholder for future implementation)
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    // TODO: Implement email verification logic
    res.json({ message: 'Email verification not implemented yet' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Forgot password (placeholder for future implementation)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // TODO: Implement password reset logic
    res.json({ message: 'Password reset not implemented yet' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Reset password (placeholder for future implementation)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // TODO: Implement password reset logic
    res.json({ message: 'Password reset not implemented yet' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;
