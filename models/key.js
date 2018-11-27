module.exports = (sequelize, DataTypes) => {
  const Key = sequelize.define('Key', {
    privateKey: DataTypes.TEXT,
    publicKey: DataTypes.TEXT,
    privateKeyPem: DataTypes.TEXT,
  }, {});
  Key.associate = function () {
    // associations can be defined here
  };
  return Key;
};
