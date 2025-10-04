const { sequelize } = require('../config/database');
const User = require('./User');
const Doctor = require('./Doctor');
const Report = require('./Report');
const SimplifiedReport = require('./SimplifiedReport');
const ChatMessage = require('./ChatMessage');
const Appointment = require('./Appointment');
const Notification = require('./Notification');
const LanguagePreference = require('./LanguagePreference');

// Define associations
const setupAssociations = () => {
  // User associations
  User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
  User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
  User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
  User.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
  User.hasOne(LanguagePreference, { foreignKey: 'userId', as: 'languagePreference' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

  // Doctor associations
  Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
  Doctor.hasMany(Notification, { foreignKey: 'doctorId', as: 'notifications' });

  // Report associations
  Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Report.hasOne(SimplifiedReport, { foreignKey: 'reportId', as: 'simplifiedReport' });

  // SimplifiedReport associations
  SimplifiedReport.belongsTo(Report, { foreignKey: 'reportId', as: 'report' });

  // ChatMessage associations
  ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ChatMessage.belongsTo(Report, { foreignKey: 'reportId', as: 'report' });

  // Appointment associations
  Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
  Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Notification.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

  // LanguagePreference associations
  LanguagePreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

// Setup associations
setupAssociations();

module.exports = {
  sequelize,
  User,
  Doctor,
  Report,
  SimplifiedReport,
  ChatMessage,
  Appointment,
  Notification,
  LanguagePreference
};
