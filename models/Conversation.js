const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./User');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New Conversation'
  }
,
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

// Define association
// Conversation.belongsTo(User, { foreignKey: 'userId' });
// User.hasMany(Conversation, { foreignKey: 'userId' });

module.exports = Conversation;