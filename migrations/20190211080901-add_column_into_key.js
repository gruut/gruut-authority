module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'Users',
    'serial_num',
    {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  ),
  down: queryInterface => queryInterface.removeColumn(
    'Users',
    'serial_num',
  ),
};
