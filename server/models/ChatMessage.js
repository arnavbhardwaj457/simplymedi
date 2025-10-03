const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
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
  reportId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'reports',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('user', 'ai', 'system'),
    allowNull: false,
    defaultValue: 'user'
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english'
  },
  aiModel: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'perplexity'
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  context: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isHelpful: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'chat_messages',
  timestamps: true
});

// Instance methods
ChatMessage.prototype.addFeedback = async function(isHelpful, feedback = null) {
  this.isHelpful = isHelpful;
  this.feedback = feedback;
  await this.save();
};

ChatMessage.prototype.updateContext = async function(newContext) {
  this.context = { ...this.context, ...newContext };
  await this.save();
};

module.exports = ChatMessage;
