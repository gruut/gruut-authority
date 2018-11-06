const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
const { User } = require('../models');
const cert = require('../utils/cert');
const userRole = require('../enums/user_role');

router.post('/users', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const phone = req.body;

    let user = await User.findOne({
      where: phone,
      attributes: ['nid'],
    });

    if (!user) {
      user = await User.create({ phone, user_role: userRole.SIGNER });
      const pem = cert.getCert(user.nid);

      return res.status(200).json({
        code: 200,
        message: '유저가 등록되었습니다.',
        nid: user.nid,
        pem,
      });
    }

    return res.status(200).json({
      code: 200,
      message: '유저가 이미 존재합니다.',
      nid: user.nid,
      pem: cert.getCert(user.nid),
    });
  } catch (err) {
    // TODO: logger로 대체해야 함
    console.error(err);

    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

module.exports = router;
