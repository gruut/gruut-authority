const forge = require('node-forge');
const Random = require('crypto-random');
const { Key, User, sequelize: { Op } } = require('../models');
const converter = require('./type_converter');

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
        user.publicKey = pki.publicKeyToPem(generatedKeys.publicKey);
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

        const commonName = {
          name: 'commonName',
          value: `${converter.nIdToBase64Str(nid)}`,
        };
        const commonNameIndex = csr.subject.attributes.findIndex(attr => attr.name === 'commonName');
        if (commonNameIndex === -1) {
          csr.subject.attributes.push(commonName);
        } else {
          csr.subject.attributes[commonNameIndex] = commonName;
        }

        cert.setSubject(csr.subject.attributes);
      }

      const serialNumber = Random.range(0, Number.MAX_SAFE_INTEGER);
      cert.serialNumber = `${serialNumber}`;
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
