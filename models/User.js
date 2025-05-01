const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },

});

module.exports = User;
