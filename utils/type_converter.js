const types = require('../enums/types');

class TypeConverter {
  static nIdToBase64Str(nid) {
    const nidString = nid.toString();
    const paddedStr = nidString.padStart(types.SIGNER_ID_TYPE_BYTES_SIZE, '0');

    const tmpBuffer = Buffer.from(paddedStr);
    return tmpBuffer.toString('base64');
  }
}

module.exports = TypeConverter;
