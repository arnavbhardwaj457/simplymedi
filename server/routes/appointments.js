const express = require('express');
const { body, validationResult } = require('express-validator');
const { Appointment, Doctor, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateAppointment = [
  body('doctorId').isUUID().withMessage('Valid doctor ID required'),
  body('appointmentDate').isISO8601().toDate().withMessage('Valid appointment date required'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
  body('type').optional().isIn(['online', 'in-person', 'phone']).withMessage('Invalid appointment type'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('medicalHistory').optional().isLength({ max: 1000 }).withMessage('Medical history must be less than 1000 characters'),
  body('currentMedications').optional().isArray().withMessage('Current medications must be an array')
];

// Book appointment
router.post('/book', validateAppointment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      doctorId,
      appointmentDate,
      duration = 30,
      type = 'online',
      reason,
      symptoms = [],
      medicalHistory,
      currentMedications = []
    } = req.body;

    // Check if doctor exists and is active
    const doctor = await Doctor.findOne({
      where: { id: doctorId, isActive: true },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    // Check if doctor is available at the requested time
    const appointmentDateTime = new Date(appointmentDate);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][appointmentDateTime.getDay()];
    const timeString = appointmentDateTime.toTimeString().substring(0, 5);

    // Basic availability check (simplified)
    if (doctor.availability && doctor.availability[dayOfWeek] && !doctor.availability[dayOfWeek].available) {
      return res.status(400).json({ error: 'Doctor is not available on this day' });
    }

    // Check for existing appointments at the same time
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId: doctorId,
        appointmentDate: appointmentDateTime,
        status: ['scheduled', 'confirmed']
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId: doctorId,
      appointmentDate: appointmentDateTime,
      duration: duration,
      type: type,
      reason: reason,
      symptoms: symptoms,
      medicalHistory: medicalHistory,
      currentMedications: currentMedications,
      fee: doctor.consultationFee,
      status: 'scheduled'
    });

    logger.info(`Appointment booked: ${appointment.id} by user ${req.user.id}`);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment.id,
        doctor: {
          id: doctor.id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee
        },
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        fee: appointment.fee,
        createdAt: appointment.createdAt
      }
    });
  } catch (error) {
    logger.error('Appointment booking error:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get user's appointments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { patientId: req.user.id };
    if (status) whereClause.status = status;

    let appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Doctor,
        as: 'doctor',
        include: [{
          model: User,
          as: 'user'
        }]
      }],
      order: [['appointmentDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter upcoming appointments if requested
    if (upcoming === 'true') {
      appointments.rows = appointments.rows.filter(appointment => 
        appointment.isUpcoming()
      );
    }

    res.json({
      appointments: appointments.rows.map(appointment => ({
        id: appointment.id,
        doctor: {
          id: appointment.doctor.id,
          name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          specialization: appointment.doctor.specialization,
          consultationFee: appointment.doctor.consultationFee,
          rating: appointment.doctor.rating
        },
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason,
        symptoms: appointment.symptoms,
        fee: appointment.fee,
        paymentStatus: appointment.paymentStatus,
        meetingLink: appointment.meetingLink,
        doctorNotes: appointment.doctorNotes,
        prescription: appointment.prescription,
        followUpRequired: appointment.followUpRequired,
        followUpDate: appointment.followUpDate,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      })),
      pagination: {
        total: appointments.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(appointments.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get specific appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        patientId: req.user.id
      },
      include: [{
        model: Doctor,
        as: 'doctor',
        include: ['user']
      }]
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      appointment: {
        id: appointment.id,
        doctor: {
          id: appointment.doctor.id,
          name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          specialization: appointment.doctor.specialization,
          consultationFee: appointment.doctor.consultationFee,
          rating: appointment.doctor.rating,
          bio: appointment.doctor.bio
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
        meetingPassword: appointment.meetingPassword,
        location: appointment.location,
        fee: appointment.fee,
        paymentStatus: appointment.paymentStatus,
        paymentId: appointment.paymentId,
        reminders: appointment.reminders,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        patientId: req.user.id
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        error: 'Appointment cannot be cancelled less than 24 hours before scheduled time' 
      });
    }

    await appointment.cancel(reason);

    logger.info(`Appointment cancelled: ${appointment.id} by user ${req.user.id}`);

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Reschedule appointment
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const { newAppointmentDate } = req.body;

    if (!newAppointmentDate) {
      return res.status(400).json({ error: 'New appointment date is required' });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        patientId: req.user.id
      },
      include: ['doctor']
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const newDateTime = new Date(newAppointmentDate);
    const dayOfWeek = newDateTime.toLocaleLowerCase().substring(0, 3);
    const timeString = newDateTime.toTimeString().substring(0, 5);

    // Check if doctor is available at the new time
    if (!appointment.doctor.isAvailableAt(`${dayOfWeek} ${timeString}`)) {
      return res.status(400).json({ error: 'Doctor is not available at the requested time' });
    }

    // Check for existing appointments at the new time
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: newDateTime,
        status: ['scheduled', 'confirmed'],
        id: { [require('sequelize').Op.ne]: appointment.id }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    await appointment.update({
      appointmentDate: newDateTime,
      status: 'scheduled'
    });

    logger.info(`Appointment rescheduled: ${appointment.id} by user ${req.user.id}`);

    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (error) {
    logger.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// Get available time slots for a doctor
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    const requestedDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[requestedDate.getDay()];
    const dayAvailability = doctor.availability ? doctor.availability[dayOfWeek] : null;

    if (!dayAvailability || !dayAvailability.available) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for the day
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId: doctorId,
        appointmentDate: {
          [require('sequelize').Op.between]: [startOfDay, endOfDay]
        },
        status: ['scheduled', 'confirmed']
      }
    });

    // Generate available time slots
    const availableSlots = [];
    const startTime = dayAvailability.start;
    const endTime = dayAvailability.end;
    const slotDuration = 30; // 30 minutes per slot

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentTime = new Date(requestedDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(requestedDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endDateTime) {
      const slotTime = new Date(currentTime);
      const isBooked = existingAppointments.some(appointment => {
        const appointmentTime = new Date(appointment.appointmentDate);
        return Math.abs(appointmentTime - slotTime) < 30 * 60 * 1000; // 30 minutes
      });

      if (!isBooked) {
        availableSlots.push({
          time: slotTime.toISOString(),
          displayTime: slotTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    res.json({ availableSlots });
  } catch (error) {
    logger.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

module.exports = router;
