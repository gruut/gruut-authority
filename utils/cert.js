const forge = require('node-forge');
const { Key, User, sequelize: { Op } } = require('../models');

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
          privateKeyPem: pki.privateKeyToPem(generatedKeys.privateKey),
        });
      }

      const users = await User.findAll({
        where: {
          role: {
            [Op.eq]: 100,
          },
        },
      });

      // eslint-disable-next-line no-restricted-syntax,guard-for-in
      for (const user in users) {
        user.publicKey = forge.pki.publicKeyToPem(global.keyPair.publicKey);
        user.cert = this.getCert({ nid: user.nid }, true);

        // eslint-disable-next-line no-await-in-loop
        await user.save();
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

  static async getCert(userInfo, selfSigned = false) {
    try {
      const { pki } = forge;
      const { nid, csr } = userInfo;
      const cert = pki.createCertificate();

      if (selfSigned) {
        cert.publicKey = global.keyPairs.publicKey;
      } else {
        cert.publicKey = csr.publicKey;
      }

      cert.serialNumber = `${nid}`;
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

      const issuerAttrs = [{
        name: 'commonName',
        value: 'theVaulters',
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

      cert.setIssuer(issuerAttrs);
      cert.setSubject(csr.subject.attributes);

      cert.sign(global.keyPairs.privateKey, forge.md.sha256.create());

      return pki.certificateToPem(cert);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Cert;
