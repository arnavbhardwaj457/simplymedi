const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30 // minutes
  },
  type: {
    type: DataTypes.ENUM('online', 'in-person', 'phone'),
    allowNull: false,
    defaultValue: 'online'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  symptoms: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  medicalHistory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentMedications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  doctorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingPassword: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
    defaultValue: 'pending'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminders: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      email: true,
      sms: false,
      push: true
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

// Instance methods
Appointment.prototype.confirm = async function() {
  this.status = 'confirmed';
  await this.save();
};

Appointment.prototype.complete = async function(doctorNotes, prescription = []) {
  this.status = 'completed';
  this.doctorNotes = doctorNotes;
  this.prescription = prescription;
  await this.save();
};

Appointment.prototype.cancel = async function(reason = null) {
  this.status = 'cancelled';
  if (reason) {
    this.notes = reason;
  }
  await this.save();
};

Appointment.prototype.isUpcoming = function() {
  return new Date(this.appointmentDate) > new Date() && 
         ['scheduled', 'confirmed'].includes(this.status);
};

Appointment.prototype.isPast = function() {
  return new Date(this.appointmentDate) < new Date();
};

Appointment.prototype.canBeCancelled = function() {
  const appointmentTime = new Date(this.appointmentDate);
  const now = new Date();
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  return this.isUpcoming() && hoursUntilAppointment > 24;
};

module.exports = Appointment;
