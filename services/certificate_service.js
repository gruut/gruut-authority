const cryptoUtils = require('jsrsasign');
const { User } = require('../models');
const Role = require('../enums/user_role');
const certUtils = require('../utils/cert');

class CertificateService {
  static async signup(requestInfo) {
    const subjectCsr = cryptoUtils.asn1.csr.CSRUtil.getInfo(requestInfo.csr);
    const pemPublicKey = cryptoUtils.asn1.ASN1Util.getPEMStringFromHex(
      subjectCsr.pubkey.hex,
      'PUBLIC KEY',
    );

    let user = await User.findOne({
      where: {
        phone: requestInfo.phone,
      },
    });

    if (!user) {
      let r;
      if (Object.values(Role).includes(parseInt(requestInfo.role, 10))) {
        r = parseInt(requestInfo.role, 10);
      } else {
        r = Role.SIGNER;
      }
      user = await User.create({ phone: requestInfo.phone, publicKey: pemPublicKey, role: r });
    }

    const { cert, serialNum } = await certUtils.createCert({
      nid: user.nid,
      csr: subjectCsr,
      role: user.role,
    });

    user.cert = cert.getPEMString();
    user.serialNum = serialNum;
    await user.save();

    return user;
  }
}

module.exports = CertificateService;
