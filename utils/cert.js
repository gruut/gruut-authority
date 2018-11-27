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

      global.keyPairs = {
        publicKey: generatedKeys.publicKey,
        privateKey: generatedKeys.privateKey,
      };

      if (keys === null) {
        keys = await Key.create({
          privateKey: JSON.stringify(generatedKeys.privateKey),
          publicKey: JSON.stringify(generatedKeys.publicKey),
          privateKeyPem: pki.privateKeyToPem(generatedKeys.privateKey),
        });
      }

      const users = await User.findAll({
        where: {
          role: { [Op.eq]: 100 },
        },
      });

      users.forEach(async (user) => {
        // eslint-disable-next-line no-param-reassign
        user.publicKey = forge.pki.publicKeyToPem(generatedKeys.publicKey);
        // eslint-disable-next-line no-param-reassign
        user.cert = await this.getCert({ nid: user.nid }, true);

        await user.save();
      });

      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const i in keys) {
        generatedKeys[i] = keys[i];
      }

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
        cert.setSubject(csr.subject.attributes);
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

      cert.sign(global.keyPairs.privateKey, forge.md.sha256.create());

      return pki.certificateToPem(cert);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Cert;
