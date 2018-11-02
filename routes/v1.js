const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
const { User } = require('../models');

router.post('/users', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const phone = req.body;

    let user = await User.findOne({
      where: phone,
      attributes: ['pid'],
    });

    if (!user) {
      user = await User.create(phone);

      return res.status(200).json({
        code: 200,
        message: '유저가 등록되었습니다.',
        pid: user.pid,
      });
    }
    return res.status(200).json({
      code: 200,
      message: '유저가 이미 존재합니다.',
      pid: user.pid,
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
