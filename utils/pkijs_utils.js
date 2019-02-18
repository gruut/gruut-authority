/* eslint-disable no-plusplus */
const Pkijs = require('pkijs');
const Asn1js = require('asn1js');
const WebCrypto = require('node-webcrypto-ossl');
const atob = require('atob');

const signAlgorithm = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: {
    name: 'SHA-256',
  },
  modulusLength: 3072,
  extractable: false,
  publicExponent: new Uint8Array([1, 0, 1]),
};

class PkiJsUtils {
  constructor() {
    const webcrypto = new WebCrypto();
    Pkijs.setEngine('engine', webcrypto.crypto, new Pkijs.CryptoEngine({
      name: 'crypto_engine',
      crypto: webcrypto,
      subtle: webcrypto.subtle,
    }));

    this.crypto = Pkijs.getCrypto();
  }

  static decodeCert(pem) {
    if (typeof pem !== 'string') {
      throw new Error('Expected PEM as string');
    }
    // Load certificate in PEM encoding (base64 encoded DER)
    const b64 = pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '');

    // Now that we have decoded the cert it's now in DER-encoding
    const der = Buffer.from(b64, 'base64');

    // And massage the cert into a BER encoded one
    const ber = new Uint8Array(der).buffer;

    // And now Asn1js can decode things \o/
    const asn1 = Asn1js.fromBER(ber);

    return new Pkijs.Certificate({
      schema: asn1.result,
    });
  }

  importPrivateKey(pemKey) {
    return new Promise(((resolve) => {
      const importer = this.crypto.subtle.importKey(
        'pkcs8', this.convertPemToBinary(pemKey), signAlgorithm, true, ['sign'],
      );
      importer.then((key) => {
        resolve(key);
      });
    }));
  }

  static convertPemToBinary(pem) {
    const lines = pem.split('\n');
    let encoded = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0
        && lines[i].indexOf('-BEGIN PRIVATE KEY-') < 0
        && lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0
        && lines[i].indexOf('-END PRIVATE KEY-') < 0
        && lines[i].indexOf('-END PUBLIC KEY-') < 0) {
        encoded += lines[i].trim();
      }
    }
    return this.base64StringToArrayBuffer(encoded);
  }

  static base64StringToArrayBuffer(b64str) {
    const byteStr = atob(b64str);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

module.exports = PkiJsUtils;
