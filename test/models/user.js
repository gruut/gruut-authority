process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const { User } = require('../../models');
const userRole = require('../../enums/user_role');
const Cert = require('../../utils/cert');

/* eslint-disable no-undef */
describe('User', function () {
  this.timeout(50000);
  Cert.generateKeyPair();

  const publicKey = '-----BEGIN PUBLIC KEY-----\n'
    + '\n'
    + ' MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0\n'
    + ' FPqri0cb2JZfXJ/DgYSF6vUpwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/\n'
    + ' 3j+skZ6UtW+5u09lHNsj6tQ51s1SPrCBkedbNf0Tp0GbMJDyR4e9T04ZZwIDAQAB\n'
    + '\n'
    + '-----END PUBLIC KEY-----';

  const cert = '-----BEGIN CERTIFICATE-----\n'
    + 'MIIDUTCCAjmgAwIBAgIBBDANBgkqhkiG9w0BAQsFADBhMRQwEgYDVQQDEwt0aGVW\n'
    + 'YXVsdGVyczELMAkGA1UEBhMCS1IxCTAHBgNVBAgTADEQMA4GA1UEBxMHSW5jaGVv\n'
    + 'bjEUMBIGA1UEChMLdGhlVmF1bHRlcnMxCTAHBgNVBAsTADAeFw0xODExMjEwNzMw\n'
    + 'MjdaFw0xOTExMjEwNzMwMjdaMHcxCzAJBgNVBAYTAlVTMQ0wCwYDVQQIDARVdGFo\n'
    + 'MQ8wDQYDVQQHDAZMaW5kb24xFjAUBgNVBAoMDURpZ2lDZXJ0IEluYy4xETAPBgNV\n'
    + 'BAsMCERpZ2lDZXJ0MR0wGwYDVQQDDBRleGFtcGxlLmRpZ2ljZXJ0LmNvbTCCASIw\n'
    + 'DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPPk6O3ftpD1ngb/6K1Ny1WycA60\n'
    + 'kG3impgpqMKeW6g8SMFdtM6kW+wD1DimKFRBRThELOk+oCJpyKJYW4h+puM4Gfwj\n'
    + '71gTpGXPnNT6NhJrwc/gA+bAXU+ZMxkAOjW1smRpXcUbYTSzrNXnzoXZ1hboSNet\n'
    + 'qpnH5YKYiFg7sKuAvX/mJHiYTZ/XRefqMJvHDkJg61fDTXYk6op/Kt6mABxyUVtv\n'
    + 'IJSVAmZE2cCGkkenKwUPE22DRNHXPgmmtwziJM9RDrB1s08fp9Myn6nG4F4uAycf\n'
    + 'gtW46bWD0QT2S/AwHlrgPHm7nVU+OMhKfNhvevxoHH+xd98TMXtMnPl2uqMCAwEA\n'
    + 'ATANBgkqhkiG9w0BAQsFAAOCAQEAbw/Cq5pd4AO1jXhAnI/OWSavu9dHXxKkgjfk\n'
    + 'UMPQ2Rzakr5xvm/Qsv2u0clqq8Cv7/NPERaD9cr1OzGGxZkKGcFyct8z6AKS8n9b\n'
    + 'z0YdDiwXws5Y4P3rWbWPywO4iTcKieS6YgSImsqu5fxfVu0ytnEMJAg7AZRKADNC\n'
    + 'TEXhb736/Ep8fqfuS3M+7OHx7FEnq+phbhWtFABlf9owm0ld/jaDblnALs8t62CP\n'
    + 'YYDDM5W7nTd26hKrPdjt9BTTrDKOL2UIatCzLvNKgUI8c5cpFDq3+PCWTBmFghkY\n'
    + 'pMKUtM2HOFKS/8uOCJwrS5qFrhNWvT0VwvYbK932otqkK8edcA==\n'
    + '-----END CERTIFICATE-----\n';

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
        cert,
      }).then((user) => {
        expect(user.phone).to.equal('010-1234-5678');
        done();
      }).catch((err) => {
        done(err);
      });
    });

    it('should not create user if phone is empty', (done) => {
      User.create({
        phone: '',
        role: userRole.SIGNER,
        publicKey,
        cert,
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
