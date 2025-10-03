const jwt = require('jsonwebtoken');
const { User, Doctor } = require('../models');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'subscription']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const authenticateDoctor = async (req, res, next) => {
  try {
    await authenticateToken(req, res, async () => {
      const doctor = await Doctor.findOne({
        where: { userId: req.user.id },
        include: ['user']
      });

      if (!doctor || !doctor.isActive) {
        return res.status(403).json({ error: 'Doctor access required' });
      }

      req.doctor = doctor;
      next();
    });
  } catch (error) {
    logger.error('Doctor authentication error:', error);
    return res.status(500).json({ error: 'Doctor authentication failed' });
  }
};

const requireSubscription = (requiredLevel = 'free') => {
  return (req, res, next) => {
    const subscriptionLevels = {
      free: 0,
      premium: 1,
      doctor: 2
    };

    const userLevel = subscriptionLevels[req.user.subscription] || 0;
    const requiredLevelValue = subscriptionLevels[requiredLevel] || 0;

    if (userLevel < requiredLevelValue) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        requiredLevel,
        currentLevel: req.user.subscription
      });
    }

    next();
  };
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authenticateToken,
  authenticateDoctor,
  requireSubscription,
  generateTokens,
  verifyRefreshToken
};
