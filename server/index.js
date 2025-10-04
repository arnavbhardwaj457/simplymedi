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
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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

// Mock doctors endpoint (for testing without auth)
app.get('/api/doctors/mock', (req, res) => {
  const mockDoctors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
      experience: 15,
      hospitalAffiliation: 'City General Hospital',
      consultationFee: 1500,
      languages: ['english', 'hindi'],
      bio: 'Experienced cardiologist specializing in heart disease prevention and treatment.',
      rating: 4.8,
      totalReviews: 342,
      consultationTypes: ['online', 'in-person'],
      availability: {
        monday: { available: true, start: '09:00', end: '17:00' },
        tuesday: { available: true, start: '09:00', end: '17:00' },
        wednesday: { available: true, start: '09:00', end: '17:00' },
        thursday: { available: true, start: '09:00', end: '17:00' },
        friday: { available: true, start: '09:00', end: '17:00' },
        saturday: { available: true, start: '09:00', end: '13:00' },
        sunday: { available: false }
      },
      isVerified: true
    },
    {
      id: '2',
      name: 'Dr. Rajesh Patel',
      specialization: 'General Medicine',
      qualifications: ['MBBS', 'MD General Medicine'],
      experience: 10,
      hospitalAffiliation: 'Apollo Hospital',
      consultationFee: 1000,
      languages: ['english', 'hindi', 'gujarati'],
      bio: 'General physician with expertise in treating common ailments and preventive care.',
      rating: 4.6,
      totalReviews: 215,
      consultationTypes: ['online', 'in-person', 'phone'],
      availability: {
        monday: { available: true, start: '10:00', end: '18:00' },
        tuesday: { available: true, start: '10:00', end: '18:00' },
        wednesday: { available: true, start: '10:00', end: '18:00' },
        thursday: { available: true, start: '10:00', end: '18:00' },
        friday: { available: true, start: '10:00', end: '18:00' },
        saturday: { available: false },
        sunday: { available: false }
      },
      isVerified: true
    },
    {
      id: '3',
      name: 'Dr. Priya Sharma',
      specialization: 'Dermatology',
      qualifications: ['MBBS', 'MD Dermatology', 'FIADVL'],
      experience: 8,
      hospitalAffiliation: 'Skin Care Clinic',
      consultationFee: 1200,
      languages: ['english', 'hindi'],
      bio: 'Skin specialist treating acne, allergies, and cosmetic dermatology.',
      rating: 4.9,
      totalReviews: 487,
      consultationTypes: ['online', 'in-person'],
      availability: {
        monday: { available: true, start: '11:00', end: '19:00' },
        tuesday: { available: true, start: '11:00', end: '19:00' },
        wednesday: { available: false },
        thursday: { available: true, start: '11:00', end: '19:00' },
        friday: { available: true, start: '11:00', end: '19:00' },
        saturday: { available: true, start: '09:00', end: '14:00' },
        sunday: { available: false }
      },
      isVerified: true
    },
    {
      id: '4',
      name: 'Dr. Amit Kumar',
      specialization: 'Orthopedics',
      qualifications: ['MBBS', 'MS Orthopedics'],
      experience: 12,
      hospitalAffiliation: 'Bone & Joint Hospital',
      consultationFee: 1800,
      languages: ['english', 'hindi'],
      bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.',
      rating: 4.7,
      totalReviews: 298,
      consultationTypes: ['in-person'],
      availability: {
        monday: { available: true, start: '09:00', end: '16:00' },
        tuesday: { available: true, start: '09:00', end: '16:00' },
        wednesday: { available: true, start: '09:00', end: '16:00' },
        thursday: { available: true, start: '09:00', end: '16:00' },
        friday: { available: true, start: '09:00', end: '16:00' },
        saturday: { available: false },
        sunday: { available: false }
      },
      isVerified: true
    }
  ];
  
  res.json({ doctors: mockDoctors });
});

// Mock availability endpoint
app.get('/api/appointments/availability/:doctorId', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }
  
  // Generate mock time slots
  const slots = [];
  const requestedDate = new Date(date);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[requestedDate.getDay()];
  
  // Default working hours (9 AM to 5 PM)
  const startHour = 9;
  const endHour = 17;
  
  // Generate 30-minute slots
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(requestedDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      const displayHour = hour > 12 ? hour - 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayMinute = minute.toString().padStart(2, '0');
      
      slots.push({
        time: slotTime.toISOString(),
        displayTime: `${displayHour}:${displayMinute} ${period}`
      });
    }
  }
  
  res.json({ availableSlots: slots });
});

// Mock dashboard endpoint (no auth required, for testing)
app.get('/api/users/dashboard/mock', (req, res) => {
  res.json({
    recentReports: [],
    upcomingAppointments: [],
    statistics: {
      totalReports: 2,
      totalAppointments: 1,
      completedAppointments: 3,
      processedReports: 2,
      pendingReports: 0
    }
  });
});

// Mock appointment booking endpoint (no auth required)
app.post('/api/appointments/book/mock', express.json(), (req, res) => {
  const { doctorId, appointmentDate, reason, type, duration } = req.body;
  
  if (!doctorId || !appointmentDate) {
    return res.status(400).json({ 
      error: 'Doctor ID and appointment date are required' 
    });
  }
  
  // Generate a mock appointment ID
  const mockAppointment = {
    id: `mock-${Date.now()}`,
    doctorId,
    appointmentDate,
    duration: duration || 30,
    type: type || 'online',
    reason: reason || '',
    status: 'scheduled',
    fee: 1000,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Appointment booked successfully',
    appointment: mockAppointment
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
