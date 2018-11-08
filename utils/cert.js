const forge = require('node-forge');
const { Key, sequelize: { Op } } = require('../models');

class Cert {
  static async generateKeyPair() {
    try {
      if (global.keyPairs) return global.keyPairs;

      const { pki } = forge;

      let keys = await Key.findOne({
        where: {
          id: { [Op.gt]: 0 },
        },
      });

      const generatedKeys = pki.rsa.generateKeyPair(2048);
      if (keys === null) {
        keys = await Key.create({
          privateKey: JSON.stringify(generatedKeys.privateKey),
          publicKey: JSON.stringify(generatedKeys.publicKey),
        });
      }

      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const i in keys) {
        generatedKeys[i] = keys[i];
      }

      global.keyPairs = {
        publicKey: generatedKeys.publicKey,
        privateKey: generatedKeys.privateKey,
      };

      return global.keyPairs;
    } catch (err) {
      throw err;
    }
  }

  static async getCert(nid) {
    try {
      const { pki } = forge;
      const keys = await this.generateKeyPair();
      const cert = pki.createCertificate();

      cert.publicKey = keys.publicKey;
      cert.serialNumber = `${nid}`;
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
  }
}

module.exports = Cert;