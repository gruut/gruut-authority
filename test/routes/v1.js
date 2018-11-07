/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { Certificate } = require('@fidm/x509');
const userRole = require('../../enums/user_role');

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = chai.should();
const { expect } = chai;
const server = require('../../app.js');
const { User, Key } = require('../../models');

chai.use(chaiHttp);

describe('POST users', function () {
  this.timeout(5000);

  before((done) => {
    // drops table and re-creates it
    Promise.all([User.sync({ force: true }), Key.sync({ force: true })]).then(() => {
      done();
    }).catch((e) => {
      done(e);
    });
  });

  it('should create user', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
      })
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('expect to have nid', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
      })
      .end((err, res) => {
        res.should.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body.nid).to.exist;
        done();
      });
  });

  it('expect to have pem', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
      })
      .end((err, res) => {
        res.should.have.status(200);
        const str = res.body.pem;

        expect(str).to.exist;
        done();
      });
  });

  it('expect to have valid certificate data', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
      })
      .end((err, res) => {
        res.should.have.status(200);
        const str = res.body.pem;

        const issuer = Certificate.fromPEM(str);

        expect(issuer.version).to.be.equal(3);
        expect(issuer.publicKey).to.exist;
        expect(issuer.signatureAlgorithm).to.be.equal('sha256WithRsaEncryption');
        expect(issuer.signature.length).to.be.equal(256);

        done();
      });
  });
});
