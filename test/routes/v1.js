process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { Certificate } = require('@fidm/x509');

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = chai.should();
const { expect } = chai;
const server = require('../../app.js');

chai.use(chaiHttp);


describe('POST users', function () {
  this.timeout(5000);

  it('should create user', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
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
      })
      .end((err, res) => {
        res.should.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body.nid).to.be.exist;
        done();
      });
  });

  it('expect to have pem', (done) => {
    chai.request(server)
      .post('/v1/users')
      .send({
        phone: '010-8770-6498',
      })
      .end((err, res) => {
        res.should.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body.pem).to.be.exist;
        const str = res.body.pem;
        const issuer = Certificate.fromPEM(str);
        done();
      });
  });
});
