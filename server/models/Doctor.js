const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [5, 20]
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  qualifications: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 50
    }
  },
  hospitalAffiliation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  availability: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: '00:00', end: '00:00', available: false }
    }
  },
  languages: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: ['english']
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  consultationTypes: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: ['online', 'in-person']
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  documents: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'doctors',
  timestamps: true
});

// Instance methods
Doctor.prototype.updateRating = async function(newRating) {
  const totalRating = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = totalRating / this.totalReviews;
  await this.save();
};

Doctor.prototype.isAvailableAt = function(dateTime) {
  const day = dateTime.toLocaleLowerCase().substring(0, 3);
  const time = dateTime.toTimeString().substring(0, 5);
  
  const dayAvailability = this.availability[day];
  if (!dayAvailability || !dayAvailability.available) {
    return false;
  }
  
  return time >= dayAvailability.start && time <= dayAvailability.end;
};

module.exports = Doctor;
