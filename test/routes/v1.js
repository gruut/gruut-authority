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
const Cert = require('../../utils/cert');

chai.use(chaiHttp);

describe('POST users', function () {
  this.timeout(5000);
  const csr = '-----BEGIN CERTIFICATE REQUEST-----\n'
    + 'MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFV0YWgxDzANBgNV\n'
    + 'BAcMBkxpbmRvbjEWMBQGA1UECgwNRGlnaUNlcnQgSW5jLjERMA8GA1UECwwIRGln\n'
    + 'aUNlcnQxHTAbBgNVBAMMFGV4YW1wbGUuZGlnaWNlcnQuY29tMIIBIjANBgkqhkiG\n'
    + '9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8+To7d+2kPWeBv/orU3LVbJwDrSQbeKamCmo\n'
    + 'wp5bqDxIwV20zqRb7APUOKYoVEFFOEQs6T6gImnIolhbiH6m4zgZ/CPvWBOkZc+c\n'
    + '1Po2EmvBz+AD5sBdT5kzGQA6NbWyZGldxRthNLOs1efOhdnWFuhI162qmcflgpiI\n'
    + 'WDuwq4C9f+YkeJhNn9dF5+owm8cOQmDrV8NNdiTqin8q3qYAHHJRW28glJUCZkTZ\n'
    + 'wIaSR6crBQ8TbYNE0dc+Caa3DOIkz1EOsHWzTx+n0zKfqcbgXi4DJx+C1bjptYPR\n'
    + 'BPZL8DAeWuA8ebudVT44yEp82G96/Ggcf7F33xMxe0yc+Xa6owIDAQABoAAwDQYJ\n'
    + 'KoZIhvcNAQEFBQADggEBAB0kcrFccSmFDmxox0Ne01UIqSsDqHgL+XmHTXJwre6D\n'
    + 'hJSZwbvEtOK0G3+dr4Fs11WuUNt5qcLsx5a8uk4G6AKHMzuhLsJ7XZjgmQXGECpY\n'
    + 'Q4mC3yT3ZoCGpIXbw+iP3lmEEXgaQL0Tx5LFl/okKbKYwIqNiyKWOMj7ZR/wxWg/\n'
    + 'ZDGRs55xuoeLDJ/ZRFf9bI+IaCUd1YrfYcHIl3G87Av+r49YVwqRDT0VDV7uLgqn\n'
    + '29XI1PpVUNCPQGn9p/eX6Qo7vpDaPybRtA2R7XLKjQaF9oXWeCUqy1hvJac9QFO2\n'
    + '97Ob1alpHPoZ7mWiEuJwjBPii6a9M9G30nUo39lBi1w=\n'
    + '-----END CERTIFICATE REQUEST-----';

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
        csr,
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
        csr,
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
        csr,
      })
      .end((err, res) => {
        res.should.have.status(200);
        const str = res.body.nid;

        expect(str).to.exist;
        done();
      });
  });

  it('expect to make error if pem format is invalid', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
        role: userRole.SIGNER,
        publicKey: '000',
      })
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });

  it('expect to have valid certificate data', (done) => {
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
        expect(issuer.signature.length).to.be.equal(256);

        done();
      });
  });
});
