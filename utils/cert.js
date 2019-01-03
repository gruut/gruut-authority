const forge = require('node-forge');

const { pki } = forge;
const cryptoUtils = require('jsrsasign');
const moment = require('moment');
const Random = require('crypto-random');
const { Key, User, sequelize: { Op } } = require('../models');
const converter = require('./type_converter');

class Cert {
  static async generateKeyPair() {
    try {
      if (global.keyPairs) return global.keyPairs;

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
        generatedKeys = pki.rsa.generateKeyPair(3072);

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

      this.updateMergerInfo(generatedKeys);

      return global.keyPairs;
    } catch (err) {
      throw err;
    }
  }

  static async updateMergerInfo(generatedKeys) {
    const users = await User.findAll({
      where: {
        role: { [Op.eq]: 100 },
      },
    });

    users.forEach(async (user) => {
      user.publicKey = pki.publicKeyToPem(generatedKeys.publicKey);
      user.cert = this.getCert({ nid: user.nid }, true);

      await user.save();
    });
  }

  static getCert(userInfo, selfSigned = false) {
    try {
      if (selfSigned) {
        return this.createSelfSignedCert();
      }

      return this.createCert(userInfo);
    } catch (err) {
      throw err;
    }
  }

  static createSelfSignedCert() {
    const cert = pki.createCertificate();

    const serialNumber = this.getSerialNum();
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
      name: 'localityName',
      value: 'Incheon',
    }];
    cert.setIssuer(issuerAttrs);

    cert.publicKey = global.keyPairs.publicKey;

    cert.sign(global.keyPairs.privateKey, forge.md.sha256.create());

    return pki.certificateToPem(cert);
  }

  static createCert(userInfo) {
    try {
      const { nid, csr } = userInfo;
      const tbsCert = new cryptoUtils.asn1.x509.TBSCertificate();

      const expiredTime = moment().add(1, 'years').valueOf();

      tbsCert.setSerialNumberByParam({ int: this.getSerialNum() });
      tbsCert.setSignatureAlgByParam({ name: 'SHA256withRSA' });

      const issuerAttrStr = `/CN=${converter.nIdToBase64Str(nid)}/C=KR/L=Incheon`;
      tbsCert.setIssuerByParam({ str: issuerAttrStr });

      tbsCert.setNotBeforeByParam({ str: `${new Date().getTime()}` });
      tbsCert.setNotAfterByParam({ str: `${expiredTime}` });
      tbsCert.setSubjectByParam({ str: csr.subject.name });
      tbsCert.setSubjectPublicKeyByGetKey(csr.pubkey.obj);

      const skPem = forge.pki.privateKeyToPem(global.keyPairs.privateKey);
      const caKey = cryptoUtils.KEYUTIL.getKey(skPem);

      const cert = new cryptoUtils.asn1.x509.Certificate({
        tbscertobj: tbsCert,
        prvkeyobj: caKey,
      });
      cert.sign();

      return cert.getPEMString();
    } catch (e) {
      // TODO: logger
      console.log(e);
      throw e;
    }
  }

  static getSerialNum() {
    return Random.range(0, Number.MAX_SAFE_INTEGER);
  }
}

module.exports = Cert;
