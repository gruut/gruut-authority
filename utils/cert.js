const forge = require('node-forge');
const { Key, sequelize: { Op } } = require('../models');

module.exports = {
  generateKeyPair: async () => {
    try {
      if (global.keyPairs) return global.keyPairs;

      const { pki } = forge;

      let keys = await Key.findOne({
        where: {
          id: { [Op.gt]: 0 },
        },
      });

      if (keys === null) {
        keys = pki.rsa.generateKeyPair(2048);

        keys = await Key.create({
          privateKey: JSON.stringify(keys.privateKey),
          publicKey: JSON.stringify(keys.publicKey),
        });
      }

      global.keyPairs = {
        publicKey: JSON.parse(keys.publicKey), privateKey: JSON.parse(keys.privateKey),
      };

      return global.keyPairs;
    } catch (err) {
      throw err;
    }
  },

  getCert: () => {
    try {
      const { pki } = forge;
      const keys = this.generateKeyPair();
      const cert = pki.createCertificate();

      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
      const attrs = [{
        name: 'commonName',
        value: '',
      }, {
        name: 'countryName',
        value: 'KR',
      }, {
        shortName: 'ST',
        value: '',
      }, {
        name: 'localityName',
        value: 'Incheon',
      }, {
        name: 'organizationName',
        value: 'theVaulters',
      }, {
        shortName: 'OU',
        value: '',
      }];
      cert.setSubject(attrs);
      cert.sign(keys.privateKey, forge.md.sha256.create());

      return pki.certificateToPem(cert);
    } catch (err) {
      throw err;
    }
  },
};
