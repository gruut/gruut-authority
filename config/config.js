require('dotenv').config();

module.exports = {
  development: {
    username: process.env.SEQUELIZE_USER,
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'gruut_authority',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false,
  },
  test: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'gruut_authority_test',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false,
    _socket: '/var/run/mysqld/mysqld.sock',
  },
  production: {
    username: process.env.SEQUELIZE_USER,
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'gruut_authority',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false,
  },
};
