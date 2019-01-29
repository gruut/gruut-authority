const express = require('express');
const bodyParser = require('body-parser');
const cryptoUtils = require('jsrsasign');

const router = express.Router();
const { User } = require('../models');
const cert = require('../utils/cert');
const converter = require('../utils/type_converter');
const userRole = require('../enums/user_role');

router.post('/users', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { phone, csr, role } = req.body;

    const subjectCsr = cryptoUtils.asn1.csr.CSRUtil.getInfo(csr);
    const pemPublicKey = cryptoUtils.asn1.ASN1Util.getPEMStringFromHex(subjectCsr.pubkey.hex, 'PUBLIC KEY');

    let user = await User.findOne({
      where: {
        phone,
      },
      attributes: ['nid'],
    });

    if (!user) {
      let r;
      if (Object.values(userRole).includes(parseInt(role, 10))) {
        r = parseInt(role, 10);
      } else {
        r = userRole.SIGNER;
      }
      user = await User.create({ phone, publicKey: pemPublicKey, role: r });

      const pem = await cert.createCert({ nid: user.nid, csr: subjectCsr, role: r });
      user.cert = pem;
      await user.save();

      return res.status(200).json({
        code: 200,
        message: '유저가 등록되었습니다.',
        nid: converter.nIdToBase64Str(user.nid),
        pem,
      });
    }

    return res.status(200).json({
      code: 200,
      message: '유저가 이미 존재합니다.',
      nid: converter.nIdToBase64Str(user.nid),
    });
  } catch (err) {
    // TODO: logger로 대체해야 함
    console.error(err);

    if (err === 'argument is not PEM file') {
      return res.status(404).json({
        code: 404,
        message: '잘못된 PEM 형식',
      });
    }

    if (err.message === 'Invalid PEM formatted message.') {
      return res.status(404).json({
        code: 404,
        message: '잘못된 PEM 형식',
      });
    }

    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

module.exports = router;
