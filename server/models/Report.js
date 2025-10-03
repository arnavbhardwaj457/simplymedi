const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Report = sequelize.define('Report', {
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
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true // Made optional since we'll use S3
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  s3Bucket: {
    type: DataTypes.STRING,
    allowNull: true
  },
  s3Url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileType: {
    type: DataTypes.ENUM('pdf', 'jpg', 'jpeg', 'png', 'txt'),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reportType: {
    type: DataTypes.ENUM('blood_test', 'urine_test', 'xray', 'mri', 'ct_scan', 'ecg', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  reportDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  labName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  extractedText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ocrConfidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  processingStatus: {
    type: DataTypes.ENUM('uploaded', 'processing', 'completed', 'failed'),
    defaultValue: 'uploaded'
  },
  processingError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  encryptionKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sharedWith: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  privacyLevel: {
    type: DataTypes.ENUM('private', 'shared', 'public'),
    defaultValue: 'private'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  hooks: {
    beforeCreate: async (report) => {
      // Generate encryption key for sensitive data
      if (report.isEncrypted && !report.encryptionKey) {
        report.encryptionKey = crypto.randomBytes(32).toString('hex');
      }
    }
  }
});

// Instance methods
Report.prototype.encryptSensitiveData = function(data) {
  if (!this.isEncrypted || !this.encryptionKey) {
    return data;
  }
  
  const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

Report.prototype.decryptSensitiveData = function(encryptedData) {
  if (!this.isEncrypted || !this.encryptionKey) {
    return encryptedData;
  }
  
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    return encryptedData;
  }
};

Report.prototype.updateProcessingStatus = async function(status, error = null) {
  this.processingStatus = status;
  if (error) {
    this.processingError = error.message || error;
  }
  await this.save();
};

module.exports = Report;
