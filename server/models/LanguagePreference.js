const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LanguagePreference = sequelize.define('LanguagePreference', {
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
  primaryLanguage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english',
    validate: {
      isIn: [['english', 'hindi', 'bengali', 'tamil', 'telugu', 'kannada', 'marathi', 'gujarati', 'punjabi', 'arabic', 'french', 'mandarin']]
    }
  },
  secondaryLanguages: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  interfaceLanguage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english'
  },
  reportLanguage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english'
  },
  chatLanguage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english'
  },
  autoTranslate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  translationQuality: {
    type: DataTypes.ENUM('fast', 'balanced', 'accurate'),
    defaultValue: 'balanced'
  },
  voiceLanguage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  textDirection: {
    type: DataTypes.ENUM('ltr', 'rtl'),
    defaultValue: 'ltr'
  },
  dateFormat: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MM/DD/YYYY'
  },
  timeFormat: {
    type: DataTypes.ENUM('12h', '24h'),
    defaultValue: '12h'
  },
  numberFormat: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en-US'
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'UTC'
  }
}, {
  tableName: 'language_preferences',
  timestamps: true
});

// Instance methods
LanguagePreference.prototype.updateLanguage = async function(languageType, language) {
  this[languageType] = language;
  await this.save();
};

LanguagePreference.prototype.getSupportedLanguages = function() {
  return {
    primary: this.primaryLanguage,
    secondary: this.secondaryLanguages,
    interface: this.interfaceLanguage,
    report: this.reportLanguage,
    chat: this.chatLanguage
  };
};

LanguagePreference.prototype.isRTL = function() {
  return this.textDirection === 'rtl';
};

module.exports = LanguagePreference;
