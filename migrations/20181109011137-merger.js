module.exports = {
  up: queryInterface => queryInterface.bulkInsert('Users', [{
    nid: 1,
    phone: '',
    role: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nid: 2,
    phone: '',
    role: 100,
    publicKey: forge.pki.publicKeyToPem(global.keyPair.publicKey),
    cert: cert.getCert({ nid: 2 }, true),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nid: 3,
    phone: '',
    role: 100,
    publicKey: forge.pki.publicKeyToPem(global.keyPair.publicKey),
    cert: cert.getCert({ nid: 3 }, true),
    createdAt: new Date(),
    updatedAt: new Date(),
  }], {}),

  down: queryInterface => queryInterface.bulkDelete('Users', null, {})
  ,
};
