const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 15]
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  medicalHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  allergies: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  currentMedications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      notifications: true,
      emailUpdates: true,
      accessibility: {
        largeFont: false,
        highContrast: false,
        screenReader: false
      }
    }
  },
  subscription: {
    type: DataTypes.ENUM('free', 'premium', 'doctor'),
    defaultValue: 'free'
  },
  subscriptionExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getPublicProfile = function() {
  const { password, ...publicProfile } = this.toJSON();
  return publicProfile;
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

module.exports = User;
