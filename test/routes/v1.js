/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const Pkijs = require('pkijs');
const Asn1js = require('asn1js');

const {
  Certificate,
} = require('@fidm/x509');
const cryptoUtils = require('jsrsasign');
const userRole = require('../../enums/user_role');
const CertValue = require('../../enums/ocsp/status_value');

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = chai.should();
const {
  expect,
} = chai;
const server = require('../../app.js');
const {
  User,
  Key,
  sequelize: {
    Op,
  },
} = require('../../models');
const Cert = require('../../utils/cert');

chai.use(chaiHttp);

const csr = '-----BEGIN CERTIFICATE REQUEST-----\n'
  + 'MIGVMHUCAQAwFTETMBEGA1UEAwwKR1JVVVRfQVVUSDBZMBMGByqGSM49AgEGCCqG\n'
  + 'SM49AwEHA0IABBvB/ubJP4S3M8Ka7GC+LzdPuMvVkjZhSdon2lhmj4+NUNMeXOsS\n'
  + 'anEQkrcraecwZbs2Clq9U1PRwMp62upKdcMwCgYIKoZIzj0DAQcDEAAwDQYJKoZI\n'
  + 'hvcNAQkOMQA=\n'
  + '-----END CERTIFICATE REQUEST-----\n';

const publicKey = '-----BEGIN PUBLIC KEY-----\n'
    + '\n'
    + ' MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0\n'
    + ' FPqri0cb2JZfXJ/DgYSF6vUpwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/\n'
    + ' 3j+skZ6UtW+5u09lHNsj6tQ51s1SPrCBkedbNf0Tp0GbMJDyR4e9T04ZZwIDAQAB\n'
    + '\n'
    + '-----END PUBLIC KEY-----';

function decodeOCSP(pem) {
  if (typeof pem !== 'string') {
    throw new Error('Expected PEM as string');
  }
  // Load certificate in PEM encoding (base64 encoded DER)
  const b64 = pem.replace(/(-----(BEGIN|END) OCSP RESPONSE-----|[\n\r])/g, '');

  // Now that we have decoded the cert it's now in DER-encoding
  const der = Buffer.from(b64, 'base64');

  // And massage the cert into a BER encoded one
  const ber = new Uint8Array(der).buffer;

  // And now Asn1js can decode things \o/
  const asn1 = Asn1js.fromBER(ber);

  return new Pkijs.OCSPResponse({
    schema: asn1.result,
  });
}

describe('POST users', () => {
  before((done) => {
    // drops table and re-creates it
    Promise.all([User.sync({
      force: true,
    })]).then(async () => {
      await Cert.generateKeyPair();
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
        csr,
      })
      .end((err, res) => {
        if (err) done(err);

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
        if (err) done(err);

        res.should.have.status(200);

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
        if (err) done(err);

        res.should.have.status(200);
        const str = res.body.nid;

        expect(str).to.exist;
        done();
      });
  });

  it('expects to accept a role parameter', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-1111',
        csr,
        role: userRole.ENDPOINT,
      })
      .end(async (err, res) => {
        if (err) done(err);

        res.should.have.status(200);

        const user = await User.findOne({
          where: {
            role: {
              [Op.eq]: userRole.ENDPOINT,
            },
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
        if (err) done(err);

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
        if (err) done(err);

        res.should.have.status(200);
        const str = res.body.certPem;

        const issuer = Certificate.fromPEM(str);

        expect(issuer.version).to.be.equal(3);
        expect(issuer.publicKey).to.exist;
        expect(issuer.signatureAlgorithm).to.be.equal('sha256WithRsaEncryption');
        expect(issuer.signature.length).to.be.equal(384);

        done();
      });
  });

  describe('GET users', () => {
    let ocspRequest = null;
    let subjectCert = null;
    let subjectSerialNum = null;

    beforeEach(async () => {
      const subjectCsr = cryptoUtils.asn1.csr.CSRUtil.getInfo(csr);
      const {
        cert,
        serialNum,
      } = await Cert.createCert({
        csr: subjectCsr,
      });

      subjectCert = cert;
      subjectSerialNum = serialNum;

      const keys = await Key.findAll();
      const key = keys[0];

      ocspRequest = new cryptoUtils.KJUR.asn1.ocsp.Request({
        issuerCert: key.certificatePem,
        subjectCert: subjectCert.getPEMString(),
      });
    });

    it('expects to have ocsp response', async () => {
      await User.create({
        cert: subjectCert.getPEMString(),
        role: userRole.SIGNER,
        phone: '010',
        publicKey,
        serialNum: subjectSerialNum,
      });

      chai.request(server)
        .get('/v1/users/verify')
        .send({
          ocspRequest,
        })
        .end((err, res) => {
          res.should.have.status(200);

          const ocspResponse = decodeOCSP(res.body.ocspResponse);
          const resValue = ocspResponse
            .responseStatus
            .valueBlock
            .valueDec;

          resValue.should.equal(CertValue.SUCCESSFUL);
        });
    });

    it("expects to return 'unknown' state", () => {
      chai.request(server)
        .get('/v1/users/verify')
        .send({
          ocspRequest,
        })
        .end((err, res) => {
          res.should.have.status(200);

          const ocspResponse = decodeOCSP(res.body.ocspResponse);
          const resValue = ocspResponse
            .responseStatus
            .valueBlock
            .valueDec;

          resValue.should.equal(CertValue.UNKNOWN);
        });
    });
  });
});
