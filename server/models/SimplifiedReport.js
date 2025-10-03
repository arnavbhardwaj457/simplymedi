const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SimplifiedReport = sequelize.define('SimplifiedReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'reports',
      key: 'id'
    }
  },
  originalText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  simplifiedText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'english'
  },
  medicalTerms: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  simplifiedTerms: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  healthRecommendations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keyFindings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  followUpActions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  aiModel: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'BioClinicalBERT'
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'simplified_reports',
  timestamps: true
});

// Instance methods
SimplifiedReport.prototype.generateSummary = function() {
  const keyFindings = this.keyFindings || [];
  const recommendations = this.healthRecommendations || [];
  
  let summary = `Your medical report has been analyzed. `;
  
  if (keyFindings.length > 0) {
    summary += `Key findings include: ${keyFindings.slice(0, 3).join(', ')}. `;
  }
  
  if (recommendations.length > 0) {
    summary += `Recommendations: ${recommendations.slice(0, 2).join(', ')}.`;
  }
  
  return summary;
};

SimplifiedReport.prototype.getRiskColor = function() {
  const riskColors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };
  return riskColors[this.riskLevel] || 'gray';
};

SimplifiedReport.prototype.updateRecommendations = async function(newRecommendations) {
  this.healthRecommendations = [...(this.healthRecommendations || []), ...newRecommendations];
  await this.save();
};

module.exports = SimplifiedReport;
