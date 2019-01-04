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
const { User, Key, sequelize: { Op } } = require('../../models');
const Cert = require('../../utils/cert');

chai.use(chaiHttp);

describe('POST users', function () {
  this.timeout(50000);
  const csr = '-----BEGIN CERTIFICATE REQUEST-----\n'
    + 'MIGVMHUCAQAwFTETMBEGA1UEAwwKR1JVVVRfQVVUSDBZMBMGByqGSM49AgEGCCqG\n'
    + 'SM49AwEHA0IABBvB/ubJP4S3M8Ka7GC+LzdPuMvVkjZhSdon2lhmj4+NUNMeXOsS\n'
    + 'anEQkrcraecwZbs2Clq9U1PRwMp62upKdcMwCgYIKoZIzj0DAQcDEAAwDQYJKoZI\n'
    + 'hvcNAQkOMQA=\n'
    + '-----END CERTIFICATE REQUEST-----\n';

  before((done) => {
    // drops table and re-creates it
    Promise.all([User.sync({ force: true }), Key.sync({ force: true })]).then(() => {
      done();
    }).catch((e) => {
      done(e);
    });
  });

  it('should create user', (done) => {
    Cert.generateKeyPair();

    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        csr,
      })
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('expects to have nid', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        csr,
      })
      .end((err, res) => {
        res.should.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body.nid).to.exist;
        done();
      });
  });

  it('expects to have pem', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        csr,
      })
      .end((err, res) => {
        res.should.have.status(200);
        const str = res.body.nid;

        expect(str).to.exist;
        done();
      });
  });

  it('expects to accept a role parameter', (done) => {
    Cert.generateKeyPair();

    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-1111',
        csr,
        role: userRole.ENDPOINT,
      })
      .end(async (err, res) => {
        res.should.have.status(200);

        const user = await User.findOne({
          where: {
            role: { [Op.eq]: userRole.ENDPOINT },
          },
        });

        expect(user.nid).to.exist;
        done();
      });
  });

  it('expects to make a error if pem format is invalid', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
        csr: '',
      })
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });

  it('expects to have valid certificate data', (done) => {
    Cert.generateKeyPair();

    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-1234-5678',
        csr,
      })
      .end((err, res) => {
        res.should.have.status(200);
        const str = res.body.pem;

        const issuer = Certificate.fromPEM(str);

        expect(issuer.version).to.be.equal(3);
        expect(issuer.publicKey).to.exist;
        expect(issuer.signatureAlgorithm).to.be.equal('sha256WithRsaEncryption');
        expect(issuer.signature.length).to.be.equal(384);

        done();
      });
  });
});
