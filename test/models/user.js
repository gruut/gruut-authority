process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const { User } = require('../../models');
const userRole = require('../../enums/user_role');

/* eslint-disable no-undef */
describe('User', () => {
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
      }).then((user) => {
        expect(user.phone).to.equal('010-1234-5678');
        done();
      });
    });

    it('should not create user if phone is empty', (done) => {
      User.create({
        phone: '',
        role: userRole.SIGNER,
      }).catch((err) => {
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });
  });
});
