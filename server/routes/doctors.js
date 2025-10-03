const express = require('express');
const { body, validationResult } = require('express-validator');
const { Doctor, User, Appointment, Report } = require('../models');
const { authenticateDoctor } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateDoctorUpdate = [
  body('specialization').optional().trim().isLength({ min: 2, max: 100 }),
  body('qualifications').optional().isArray(),
  body('experience').optional().isInt({ min: 0, max: 50 }),
  body('hospitalAffiliation').optional().trim().isLength({ max: 200 }),
  body('consultationFee').optional().isDecimal({ decimal_digits: '0,2' }),
  body('availability').optional().isObject(),
  body('languages').optional().isArray(),
  body('bio').optional().isLength({ max: 1000 }),
  body('consultationTypes').optional().isArray()
];

// Get all doctors (public)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      specialization, 
      language, 
      minRating, 
      maxFee,
      consultationType 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true, isVerified: true };
    
    if (specialization) {
      whereClause.specialization = {
        [require('sequelize').Op.iLike]: `%${specialization}%`
      };
    }
    
    if (minRating) {
      whereClause.rating = {
        [require('sequelize').Op.gte]: parseFloat(minRating)
      };
    }
    
    if (maxFee) {
      whereClause.consultationFee = {
        [require('sequelize').Op.lte]: parseFloat(maxFee)
      };
    }

    const { count, rows: doctors } = await Doctor.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['rating', 'DESC'], ['totalReviews', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by language and consultation type if specified
    let filteredDoctors = doctors;
    
    if (language) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.languages.includes(language)
      );
    }
    
    if (consultationType) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.consultationTypes.includes(consultationType)
      );
    }

    res.json({
      doctors: filteredDoctors.map(doctor => ({
        id: doctor.id,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`,
        specialization: doctor.specialization,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        hospitalAffiliation: doctor.hospitalAffiliation,
        consultationFee: doctor.consultationFee,
        languages: doctor.languages,
        bio: doctor.bio,
        rating: doctor.rating,
        totalReviews: doctor.totalReviews,
        consultationTypes: doctor.consultationTypes,
        availability: doctor.availability,
        profilePicture: doctor.profilePicture,
        isVerified: doctor.isVerified
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get specific doctor profile
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      where: { 
        id: req.params.id, 
        isActive: true 
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      doctor: {
        id: doctor.id,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`,
        specialization: doctor.specialization,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        hospitalAffiliation: doctor.hospitalAffiliation,
        consultationFee: doctor.consultationFee,
        languages: doctor.languages,
        bio: doctor.bio,
        rating: doctor.rating,
        totalReviews: doctor.totalReviews,
        consultationTypes: doctor.consultationTypes,
        availability: doctor.availability,
        profilePicture: doctor.profilePicture,
        isVerified: doctor.isVerified,
        createdAt: doctor.createdAt
      }
    });
  } catch (error) {
    logger.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
});

// Get doctor's own profile (authenticated)
router.get('/profile/me', authenticateDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    res.json({
      doctor: {
        id: doctor.id,
        user: doctor.user.getPublicProfile(),
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        hospitalAffiliation: doctor.hospitalAffiliation,
        consultationFee: doctor.consultationFee,
        languages: doctor.languages,
        bio: doctor.bio,
        rating: doctor.rating,
        totalReviews: doctor.totalReviews,
        consultationTypes: doctor.consultationTypes,
        availability: doctor.availability,
        profilePicture: doctor.profilePicture,
        isVerified: doctor.isVerified,
        documents: doctor.documents,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
});

// Update doctor profile
router.patch('/profile/me', authenticateDoctor, validateDoctorUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedFields = [
      'specialization', 'qualifications', 'experience', 'hospitalAffiliation',
      'consultationFee', 'availability', 'languages', 'bio', 'consultationTypes'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await Doctor.update(updateData, {
      where: { userId: req.user.id }
    });

    const updatedDoctor = await Doctor.findOne({
      where: { userId: req.user.id },
      include: ['user']
    });

    logger.info(`Doctor profile updated: ${req.user.id}`);

    res.json({
      message: 'Profile updated successfully',
      doctor: {
        id: updatedDoctor.id,
        specialization: updatedDoctor.specialization,
        qualifications: updatedDoctor.qualifications,
        experience: updatedDoctor.experience,
        hospitalAffiliation: updatedDoctor.hospitalAffiliation,
        consultationFee: updatedDoctor.consultationFee,
        languages: updatedDoctor.languages,
        bio: updatedDoctor.bio,
        consultationTypes: updatedDoctor.consultationTypes,
        availability: updatedDoctor.availability,
        updatedAt: updatedDoctor.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get doctor's appointments
router.get('/appointments/me', authenticateDoctor, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { doctorId: req.doctor.id };
    if (status) whereClause.status = status;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.appointmentDate = {
        [require('sequelize').Op.between]: [startOfDay, endOfDay]
      };
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
      }],
      order: [['appointmentDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        patient: {
          id: appointment.patient.id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          email: appointment.patient.email,
          phoneNumber: appointment.patient.phoneNumber
        },
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason,
        symptoms: appointment.symptoms,
        medicalHistory: appointment.medicalHistory,
        currentMedications: appointment.currentMedications,
        notes: appointment.notes,
        doctorNotes: appointment.doctorNotes,
        prescription: appointment.prescription,
        followUpRequired: appointment.followUpRequired,
        followUpDate: appointment.followUpDate,
        meetingLink: appointment.meetingLink,
        fee: appointment.fee,
        paymentStatus: appointment.paymentStatus,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment (doctor only)
router.patch('/appointments/:id', authenticateDoctor, async (req, res) => {
  try {
    const { status, doctorNotes, prescription, followUpRequired, followUpDate } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        doctorId: req.doctor.id
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes;
    if (prescription !== undefined) updateData.prescription = prescription;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate) updateData.followUpDate = followUpDate;

    await appointment.update(updateData);

    logger.info(`Appointment updated: ${appointment.id} by doctor ${req.doctor.id}`);

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    logger.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Complete appointment
router.patch('/appointments/:id/complete', authenticateDoctor, async (req, res) => {
  try {
    const { doctorNotes, prescription = [] } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        doctorId: req.doctor.id
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await appointment.complete(doctorNotes, prescription);

    logger.info(`Appointment completed: ${appointment.id} by doctor ${req.doctor.id}`);

    res.json({ message: 'Appointment completed successfully' });
  } catch (error) {
    logger.error('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
});

// Get doctor dashboard data
router.get('/dashboard/me', authenticateDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysAppointments = await Appointment.findAll({
      where: {
        doctorId: doctorId,
        appointmentDate: {
          [require('sequelize').Op.between]: [today, endOfDay]
        }
      },
      include: ['patient'],
      order: [['appointmentDate', 'ASC']]
    });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.findAll({
      where: {
        doctorId: doctorId,
        status: ['scheduled', 'confirmed'],
        appointmentDate: {
          [require('sequelize').Op.gte]: new Date()
        }
      },
      include: ['patient'],
      order: [['appointmentDate', 'ASC']],
      limit: 10
    });

    // Get statistics
    const stats = await Promise.all([
      Appointment.count({ where: { doctorId } }),
      Appointment.count({ 
        where: { 
          doctorId, 
          status: 'completed' 
        } 
      }),
      Appointment.count({ 
        where: { 
          doctorId, 
          status: 'scheduled' 
        } 
      }),
      Appointment.count({ 
        where: { 
          doctorId, 
          status: 'confirmed' 
        } 
      })
    ]);

    const [totalAppointments, completedAppointments, scheduledAppointments, confirmedAppointments] = stats;

    res.json({
      todaysAppointments: todaysAppointments.map(appointment => ({
        id: appointment.id,
        patient: {
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phoneNumber: appointment.patient.phoneNumber
        },
        appointmentDate: appointment.appointmentDate,
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason
      })),
      upcomingAppointments: upcomingAppointments.map(appointment => ({
        id: appointment.id,
        patient: {
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phoneNumber: appointment.patient.phoneNumber
        },
        appointmentDate: appointment.appointmentDate,
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason
      })),
      statistics: {
        totalAppointments,
        completedAppointments,
        scheduledAppointments,
        confirmedAppointments,
        pendingAppointments: scheduledAppointments + confirmedAppointments
      }
    });
  } catch (error) {
    logger.error('Error fetching doctor dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update doctor availability
router.patch('/availability/me', authenticateDoctor, async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ error: 'Valid availability object is required' });
    }

    await Doctor.update(
      { availability },
      { where: { userId: req.user.id } }
    );

    logger.info(`Doctor availability updated: ${req.user.id}`);

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    logger.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
