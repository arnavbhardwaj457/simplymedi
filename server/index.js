const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const reportsSimpleRoutes = require('./routes/reports-simple');
const chatRoutes = require('./routes/chat-simple');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/users');
const doctorRoutes = require('./routes/doctors');
const doctorsPublicRoutes = require('./routes/doctors-public');
const languageRoutes = require('./routes/languages');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Serve static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'SimplyMedi API Server',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      reports: '/api/reports',
      chat: '/api/chat',
      appointments: '/api/appointments',
      users: '/api/users',
      doctors: '/api/doctors'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/reports-simple', reportsSimpleRoutes); // Simplified upload without auth
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/doctors-public', doctorsPublicRoutes); // Public doctors listing
app.use('/api/doctors', authenticateToken, doctorRoutes);
app.use('/api/languages', languageRoutes); // Language services (public access)

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection and server startup
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync database (in production, use migrations)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();
