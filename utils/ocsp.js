/* eslint-disable no-use-before-define */
const Pkijs = require('pkijs');
const Asn1js = require('asn1js');
const PvUtils = require('pvutils');

const PkiJsUtils = require('../utils/pkijs_utils');

const StatusName = require('../enums/ocsp/status_name');
const StatusValue = require('../enums/ocsp/status_value');

const {
  User,
  Key,
} = require('../models');

async function getOCSPResponse(ocspRequest) {
  // TODO: user의 certificate의 날짜가 유효한지 확인하고, 만료되었다면 serialNum
  // 필드를 NULL로 설정
  const pkijsUtils = new PkiJsUtils();
  const serialNum = parseInt(ocspRequest.dReqCert.dSerialNumber.hV, 16);
  const user = await User.findOne({
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
    const pkijsCert = pkijsUtils.decodeCert(user.cert);

    ocspBasicResp.tbsResponseData.responderID = pkijsCert.issuer;
    ocspBasicResp.tbsResponseData.producedAt = new Date();
    ocspBasicResp.certs = [pkijsCert];
  }

  const keys = await Key.findAll();
  const skPem = keys[0].privateKeyPem;

  const sk = await pkijsUtils.importPrivateKey(skPem);
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
    PvUtils.toBase64(
      PvUtils.arrayBufferToString(ocspRespSimpl.toSchema().toBER(false)),
    ),
  );
  return pem;
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

module.exports = {
  getOCSPResponse,
};
