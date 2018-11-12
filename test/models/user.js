process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const { User } = require('../../models');
const userRole = require('../../enums/user_role');

/* eslint-disable no-undef */
describe('User', () => {
  const publicKey = '-----BEGIN PUBLIC KEY-----\n'
    + '\n'
    + ' MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0\n'
    + ' FPqri0cb2JZfXJ/DgYSF6vUpwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/\n'
    + ' 3j+skZ6UtW+5u09lHNsj6tQ51s1SPrCBkedbNf0Tp0GbMJDyR4e9T04ZZwIDAQAB\n'
    + '\n'
    + '-----END PUBLIC KEY-----';

  before((done) => {
    User.sync({ force: true }) // drops table and re-creates it
      .then(() => {
        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  describe('#create', () => {
    it('should create user', (done) => {
      User.create({
        phone: '010-1234-5678',
        role: userRole.SIGNER,
        publicKey,
      }).then((user) => {
        expect(user.phone).to.equal('010-1234-5678');
        done();
      });
    });

    it('should not create user if phone is empty', (done) => {
      User.create({
        phone: '',
        role: userRole.SIGNER,
        publicKey,
      }).catch((err) => {
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it('should not create user if publicKey is empty', (done) => {
      User.create({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
        publicKey: '',
      }).catch((err) => {
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });
  });
});
