module.exports = {
  up: queryInterface => queryInterface.bulkInsert('Users', [{
    phone: '',
    role: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    phone: '',
    role: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    phone: '',
    role: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  }], {}),

  down: queryInterface => queryInterface.bulkDelete('Users', null, {})
  ,
};
