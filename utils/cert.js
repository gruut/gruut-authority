const forge = require('node-forge');

module.exports = {
  getCert: () => {
    try {
      const { pki } = forge;
      const keys = pki.rsa.generateKeyPair(2048);
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
