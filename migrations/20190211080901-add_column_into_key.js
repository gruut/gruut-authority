module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'Users',
    'serialNum',
    {
      type: Sequelize.BIGINT,
    },
  ),
  down: queryInterface => queryInterface.removeColumn(
    'Users',
    'serialNum',
  ),
};
