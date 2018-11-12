const Sequelize = require('sequelize');
const userRole = require('../enums/user_role');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    publicKey: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
  });

  User.beforeCreate((user) => {
    if (user.role === userRole.SIGNER) {
      if (user.phone === '' || typeof user.phone === 'undefined') throw Sequelize.ValidationError;
      if (user.publicKey === '' || typeof user.publicKey === 'undefined') throw Sequelize.ValidationError;
    }
  });

  return User;
};
