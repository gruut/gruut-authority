process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const { User } = require('../../models');

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
      }).then((user) => {
        expect(user.phone).to.equal('010-1234-5678');
        done();
      });
    });

    it('should not create user if phone is empty', (done) => {
      User.create({
        phone: '',
      }).catch((err) => {
        expect(err.name).to.equal('SequelizeValidationError');
        done();
      });
    });
  });
});
