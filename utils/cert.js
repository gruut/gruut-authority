const forge = require('node-forge');
const { Key, User, sequelize: { Op } } = require('../models');

class Cert {
  static async generateKeyPair() {
    try {
      if (global.keyPairs) return global.keyPairs;

      const { pki } = forge;

      const keys = await Key.findOne({
        where: {
          id: { [Op.gt]: 0 },
        },
      });

      let generatedKeys = {};
      if (keys) {
        generatedKeys.publicKey = pki.publicKeyFromPem(keys.publicKeyPem);
        generatedKeys.privateKey = pki.privateKeyFromPem(keys.privateKeyPem);
      } else {
        generatedKeys = pki.rsa.generateKeyPair(2048);

        // Generate PKCS#8 Private Key
        const rsaPrivateKey = pki.privateKeyToAsn1(generatedKeys.privateKey);
        const privateKeyInfo = pki.wrapRsaPrivateKey(rsaPrivateKey);
        const privateKeyPem = pki.privateKeyInfoToPem(privateKeyInfo);

        await Key.create({
          publicKeyPem: pki.publicKeyToPem(generatedKeys.publicKey),
          privateKeyPem,
        });
      }

      global.keyPairs = {
        publicKey: generatedKeys.publicKey,
        privateKey: generatedKeys.privateKey,
      };

      const users = await User.findAll({
        where: {
          role: { [Op.eq]: 100 },
        },
      });

      users.forEach(async (user) => {
        // eslint-disable-next-line no-param-reassign
        user.publicKey = pki.publicKeyToPem(generatedKeys.publicKey);
        // eslint-disable-next-line no-param-reassign
        user.cert = await this.getCert({ nid: user.nid }, true);

        await user.save();
      });

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
