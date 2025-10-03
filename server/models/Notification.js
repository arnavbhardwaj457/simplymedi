const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('appointment', 'report', 'chat', 'system', 'reminder', 'payment'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actionText: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryMethod: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      email: false,
      sms: false,
      push: true,
      inApp: true
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

Notification.prototype.markAsSent = async function() {
  this.sentAt = new Date();
  await this.save();
};

Notification.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

Notification.prototype.shouldSend = function() {
  return !this.sentAt && 
         (!this.scheduledFor || new Date() >= this.scheduledFor) &&
         !this.isExpired();
};

module.exports = Notification;
