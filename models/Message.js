const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const Conversation = require('./Conversation');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isVoiceMessage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  audioFilePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  conversationId:{
    type: DataTypes.STRING,
    allowNull: false

  }
});

// // Define association
// Message.belongsTo(Conversation, { foreignKey: 'conversationId' });
// Conversation.hasMany(Message, { foreignKey: 'conversationId' });

module.exports = Message;