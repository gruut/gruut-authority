/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const converter = require('../../utils/type_converter');

/* eslint-disable no-undef */
describe('TypeConverter', () => {
  describe('#nIdToBase64Str', () => {
    it('should generate key pairs', (done) => {
      const encodedStr = converter.nIdToBase64Str(20000);
      const len = Buffer.byteLength(encodedStr, 'base64');

      expect(len).to.equals(8);
      expect(encodedStr).to.equals('MDAwMjAwMDA=');

      const b64String = Buffer.from(encodedStr, 'base64').toString();
      expect(b64String).to.equals('00020000');
      done();
    });
  });
});
