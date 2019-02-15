/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
const Pkijs = require('pkijs');
const Asn1js = require('asn1js');
const WebCrypto = require('node-webcrypto-ossl');
const PvUtils = require('pvutils');
const atob = require('atob');

const StatusName = require('../enums/ocsp/status_name');
const StatusValue = require('../enums/ocsp/status_value');

const {
  User,
  Key,
} = require('../models');

let crypto = null;
const signAlgorithm = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: {
    name: 'SHA-256',
  },
  modulusLength: 3072,
  extractable: false,
  publicExponent: new Uint8Array([1, 0, 1]),
};

async function getOCSPResponse(ocspRequest) {
  // TODO: user의 certificate의 날짜가 유효한지 확인하고, 만료되었다면 serialNum 필드를 NULL로 설정
  setEngine();

  crypto = Pkijs.getCrypto();

  const serialNum = parseInt(ocspRequest.dReqCert.dSerialNumber.hV, 16);

  const user = await User.find({
    where: {
      serialNum,
    },
  });

  const ocspRespSimpl = new Pkijs.OCSPResponse();
  ocspRespSimpl.responseStatus.valueBlock.valueDec = getCertStatusValueFrom(user);
  ocspRespSimpl.responseBytes = new Pkijs.ResponseBytes();
  ocspRespSimpl.responseBytes.responseType = '1.3.6.1.5.5.7.48.1.1'; // Basic OCSP Response

  const ocspBasicResp = new Pkijs.BasicOCSPResponse();
  ocspBasicResp.tbsResponseData.producedAt = new Date();

  if (user !== null) {
    const pkijsCert = decodeCert(user.cert);

    ocspBasicResp.tbsResponseData.responderID = pkijsCert.issuer;
    ocspBasicResp.tbsResponseData.producedAt = new Date();
    ocspBasicResp.certs = [pkijsCert];
  }

  const keys = await Key.findAll();
  const skPem = keys[0].privateKeyPem;

  const sk = await importPrivateKey(skPem);
  await ocspBasicResp.sign(sk, sk.algorithm.hash.name);

  const response = new Pkijs.SingleResponse();
  response.certID.serialNumber.valueBlock.valueDec = serialNum;
  response.thisUpdate = new Date();
  response.certStatus = new Asn1js.Primitive({
    idBlock: {
      tagClass: 3, // CONTEXT-SPECIFIC
      tagNumber: getCertStatusNameFrom(user),
    },
    lenBlockLength: 1, // The length contains one byte 0x00
  });
  ocspBasicResp.tbsResponseData.responses.push(response);

  const encodedOCSPBasicResp = ocspBasicResp.toSchema().toBER(false);
  ocspRespSimpl.responseBytes.response = new Asn1js.OctetString({
    valueHex: encodedOCSPBasicResp,
  });

  const pem = formatPEM(
    PvUtils
      .toBase64(
        PvUtils.arrayBufferToString(ocspRespSimpl.toSchema().toBER(false)),
      ),
  );
  return pem;
}

function setEngine() {
  const webcrypto = new WebCrypto();
  Pkijs.setEngine('engine', webcrypto.crypto, new Pkijs.CryptoEngine({
    name: 'crypto_engine',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  }));
}

function decodeCert(pem) {
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

function getCertStatusValueFrom(user) {
  if (user !== null) {
    return StatusValue.SUCCESSFUL;
  }

  return StatusValue.NOT_USED;
}

function getCertStatusNameFrom(user) {
  if (user !== null) {
    // TODO: Check valid
    return StatusName.GOOD;
  }

  return StatusName.UNKNOWN;
}

function formatPEM(pemString) {
  const stringLength = pemString.length;
  let resultString = '-----BEGIN OCSP RESPONSE-----\r\n';

  // eslint-disable-next-line no-plusplus
  for (let i = 0, count = 0; i < stringLength; i++, count++) {
    if (count > 63) {
      resultString = `${resultString}\r\n`;
      count = 0;
    }

    resultString += pemString[i];
  }

  resultString += '\r\n-----END OCSP RESPONSE-----\r\n\r\n';
  return resultString;
}

function importPrivateKey(pemKey) {
  return new Promise(((resolve) => {
    const importer = crypto.subtle.importKey('pkcs8', convertPemToBinary(pemKey), signAlgorithm, true, ['sign']);
    importer.then((key) => {
      resolve(key);
    });
  }));
}

function convertPemToBinary(pem) {
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
  return base64StringToArrayBuffer(encoded);
}

function base64StringToArrayBuffer(b64str) {
  const byteStr = atob(b64str);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes.buffer;
}

module.exports = {
  getOCSPResponse,
};
