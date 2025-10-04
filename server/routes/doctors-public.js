const express = require('express');
const { Op } = require('sequelize');
const { Doctor, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Get all doctors (public - no authentication required)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      specialization, 
      language, 
      minRating 
    } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (specialization) whereClause.specialization = specialization;
    if (minRating) whereClause.rating = { [Op.gte]: parseFloat(minRating) };

    const doctors = await Doctor.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }],
      attributes: [
        'id', 'specialization', 'qualifications', 'experience', 
        'hospitalAffiliation', 'consultationFee', 'rating', 
        'totalReviews', 'languages', 'bio', 'consultationTypes'
      ],
      order: [['rating', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      doctors: doctors.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: doctors.count,
        pages: Math.ceil(doctors.count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching doctors:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch doctors'
    });
  }
});

// Get doctor by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }],
      attributes: [
        'id', 'specialization', 'qualifications', 'experience', 
        'hospitalAffiliation', 'consultationFee', 'rating', 
        'totalReviews', 'languages', 'bio', 'consultationTypes',
        'availability'
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'Doctor not found'
      });
    }

    res.json(doctor);

  } catch (error) {
    logger.error('Error fetching doctor:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch doctor'
    });
  }
});

module.exports = router;