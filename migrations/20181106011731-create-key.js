module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Keys', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    privateKey: {
      type: Sequelize.TEXT,
    },
    publicKey: {
      type: Sequelize.TEXT,
    },
    privateKeyPem: {
      type: Sequelize.TEXT,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: queryInterface => queryInterface.dropTable('Keys'),
};
