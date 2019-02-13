/* eslint-disable no-use-before-define */
const Pkijs = require('pkijs');
const Asn1js = require('asn1js');
const WebCrypto = require('node-webcrypto-ossl');

const {
  User,
} = require('../models');

async function getOCSPResponse(ocspRequest) {
  Pkijs.setEngine();

  const serialNum = parseInt(ocspRequest.dReqCert.dSerialNumber.hV, 16);
  const user = await User.find({
    where: {
      serialNum,
    },
  });

  // TODO: user의 certificate의 날짜가 유효한지 확인하고, 만료되었다면 serialNum 필드를 NULL로 설정
  if (user !== null) {
    const webcrypto = new WebCrypto();
    Pkijs.setEngine('engine', webcrypto.crypto, new Pkijs.CryptoEngine({
      name: 'crypto_engine',
      crypto: webcrypto,
      subtle: webcrypto.subtle,
    }));

    const pkijsCert = decodeCert(user.cert);
    const ocspRespSimpl = new Pkijs.OCSPResponse();
    const ocspBasicResp = new Pkijs.BasicOCSPResponse();

    ocspRespSimpl.responseStatus.valueBlock.valueDec = 0; // success
    ocspRespSimpl.responseBytes = new Pkijs.ResponseBytes();
    ocspRespSimpl.responseBytes.responseType = '1.3.6.1.5.5.7.48.1.1'; // Basic OCSP Response

    ocspBasicResp.tbsResponseData.responderID = pkijsCert.issuer;
    ocspBasicResp.tbsResponseData.producedAt = new Date();

    const response = new Pkijs.SingleResponse();
    response.certID.serialNumber.valueBlock.valueDec = serialNum;
    response.certStatus = new Asn1js.Primitive({
      name: 'good',
      idBlock: {
        tagClass: 3, // CONTEXT-SPECIFIC
        tagNumber: 0, // [0]
      },
      lenBlockLength: 1, // The length contains one byte 0x00
    }); // status - success
    response.thisUpdate = new Date();

    ocspBasicResp.tbsResponseData.responses.push(response);

    ocspBasicResp.certs = [pkijsCert];

    // const resp = await ocspBasicResp.sign(global.keyPairs.privateKey, 'SHA-256');
    return ocspBasicResp;
  }

  return null;
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

module.exports = {
  getOCSPResponse,
};
