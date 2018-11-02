process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = chai.should();
const server = require('../../app.js');

chai.use(chaiHttp);

describe('POST users', () => {
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
});
