/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const { Key } = require('../../models');
const cert = require('../../utils/cert');

/* eslint-disable no-undef */
// eslint-disable-next-line space-before-function-paren
describe('Key', () => {
  before((done) => {
    Key.sync({ force: true }) // drops table and re-creates it
      .then(() => {
        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  describe('#generateKeyPair', function () {
    this.timeout(5000);

    it('should generate key pairs', (done) => {
      cert.generateKeyPair().then(() => {
        expect(global.keyPairs.publicKey).to.exist;
        expect(global.keyPairs.privateKey).to.exist;
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
});
