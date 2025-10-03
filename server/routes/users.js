const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, LanguagePreference, Report, Appointment } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateUserUpdate = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('phoneNumber').optional().isMobilePhone(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('address').optional().isLength({ max: 500 }),
  body('emergencyContact').optional().isObject(),
  body('medicalHistory').optional().isArray(),
  body('allergies').optional().isArray(),
  body('currentMedications').optional().isArray(),
  body('preferences').optional().isObject()
];

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: ['languagePreference']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.getPublicProfile(),
      languagePreference: user.languagePreference
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.patch('/profile', validateUserUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'gender',
      'address', 'emergencyContact', 'medicalHistory', 'allergies',
      'currentMedications', 'preferences'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    const updatedUser = await User.findByPk(req.user.id, {
      include: ['languagePreference']
    });

    logger.info(`User profile updated: ${req.user.id}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.getPublicProfile(),
      languagePreference: updatedUser.languagePreference
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update language preferences
router.patch('/language-preferences', async (req, res) => {
  try {
    const {
      primaryLanguage,
      secondaryLanguages,
      interfaceLanguage,
      reportLanguage,
      chatLanguage,
      autoTranslate,
      translationQuality,
      voiceLanguage,
      textDirection,
      dateFormat,
      timeFormat,
      numberFormat,
      currency,
      timezone
    } = req.body;

    const languagePreference = await LanguagePreference.findOne({
      where: { userId: req.user.id }
    });

    if (languagePreference) {
      await languagePreference.update({
        primaryLanguage,
        secondaryLanguages,
        interfaceLanguage,
        reportLanguage,
        chatLanguage,
        autoTranslate,
        translationQuality,
        voiceLanguage,
        textDirection,
        dateFormat,
        timeFormat,
        numberFormat,
        currency,
        timezone
      });
    } else {
      await LanguagePreference.create({
        userId: req.user.id,
        primaryLanguage,
        secondaryLanguages,
        interfaceLanguage,
        reportLanguage,
        chatLanguage,
        autoTranslate,
        translationQuality,
        voiceLanguage,
        textDirection,
        dateFormat,
        timeFormat,
        numberFormat,
        currency,
        timezone
      });
    }

    logger.info(`Language preferences updated: ${req.user.id}`);

    res.json({ message: 'Language preferences updated successfully' });
  } catch (error) {
    logger.error('Error updating language preferences:', error);
    res.status(500).json({ error: 'Failed to update language preferences' });
  }
});

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent reports
    const recentReports = await Report.findAll({
      where: { userId },
      include: ['simplifiedReport'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.findAll({
      where: {
        patientId: userId,
        status: ['scheduled', 'confirmed'],
        appointmentDate: {
          [require('sequelize').Op.gte]: new Date()
        }
      },
      include: ['doctor'],
      order: [['appointmentDate', 'ASC']],
      limit: 5
    });

    // Get statistics
    const stats = await Promise.all([
      Report.count({ where: { userId } }),
      Appointment.count({ where: { patientId: userId } }),
      Appointment.count({ 
        where: { 
          patientId: userId, 
          status: 'completed' 
        } 
      }),
      Report.count({ 
        where: { 
          userId,
          processingStatus: 'completed'
        } 
      })
    ]);

    const [totalReports, totalAppointments, completedAppointments, processedReports] = stats;

    res.json({
      recentReports: recentReports.map(report => ({
        id: report.id,
        fileName: report.originalFileName,
        reportType: report.reportType,
        processingStatus: report.processingStatus,
        simplifiedReport: report.simplifiedReport ? {
          summary: report.simplifiedReport.summary,
          riskLevel: report.simplifiedReport.riskLevel
        } : null,
        createdAt: report.createdAt
      })),
      upcomingAppointments: upcomingAppointments.map(appointment => ({
        id: appointment.id,
        doctor: {
          name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          specialization: appointment.doctor.specialization
        },
        appointmentDate: appointment.appointmentDate,
        type: appointment.type,
        status: appointment.status
      })),
      statistics: {
        totalReports,
        totalAppointments,
        completedAppointments,
        processedReports,
        pendingReports: totalReports - processedReports
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get user's medical history summary
router.get('/medical-history', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['medicalHistory', 'allergies', 'currentMedications']
    });

    // Get all processed reports for medical history
    const reports = await Report.findAll({
      where: {
        userId: req.user.id,
        processingStatus: 'completed'
      },
      include: ['simplifiedReport'],
      order: [['reportDate', 'DESC']]
    });

    res.json({
      medicalHistory: user.medicalHistory || [],
      allergies: user.allergies || [],
      currentMedications: user.currentMedications || [],
      reports: reports.map(report => ({
        id: report.id,
        fileName: report.originalFileName,
        reportType: report.reportType,
        reportDate: report.reportDate,
        labName: report.labName,
        doctorName: report.doctorName,
        summary: report.simplifiedReport?.summary,
        riskLevel: report.simplifiedReport?.riskLevel,
        keyFindings: report.simplifiedReport?.keyFindings,
        createdAt: report.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

// Update medical history
router.patch('/medical-history', async (req, res) => {
  try {
    const { medicalHistory, allergies, currentMedications } = req.body;

    const updateData = {};
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (currentMedications !== undefined) updateData.currentMedications = currentMedications;

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    logger.info(`Medical history updated: ${req.user.id}`);

    res.json({ message: 'Medical history updated successfully' });
  } catch (error) {
    logger.error('Error updating medical history:', error);
    res.status(500).json({ error: 'Failed to update medical history' });
  }
});

// Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isRead: notification.isRead,
        readAt: notification.readAt,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        createdAt: notification.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete user account
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }

    const user = await User.findByPk(req.user.id);
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Soft delete - deactivate account
    await user.update({ isActive: false });

    logger.info(`User account deactivated: ${req.user.id}`);

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    logger.error('Error deactivating account:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

module.exports = router;
