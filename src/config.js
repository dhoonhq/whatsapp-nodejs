// const globalConfig = require('/etc/whatsapp.json');
const crypto = require('crypto');

module.exports = {
  version: '2.22.24.79', // 最新安卓版本

  md5Class: 'aB7TRBP7/nT6KypPakIupw==',

  mongodb: 'mongodb://localhost:27017/whatsapp',

  isUseBufferLength: true, // 使用二进制流计算包体长度

  signature: `MIIDMjCCAvCgAwIBAgIETCU2pDALBgcqhkjOOAQDBQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFDASBgNV
  BAcTC1NhbnRhIENsYXJhMRYwFAYDVQQKEw1XaGF0c0FwcCBJbmMuMRQwEgYDVQQLEwtFbmdpbmVlcmluZzEUMBIGA1UEAxMLQnJ
  pYW4gQWN0b24wHhcNMTAwNjI1MjMwNzE2WhcNNDQwMjE1MjMwNzE2WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5
  pYTEUMBIGA1UEBxMLU2FudGEgQ2xhcmExFjAUBgNVBAoTDVdoYXRzQXBwIEluYy4xFDASBgNVBAsTC0VuZ2luZWVyaW5nMRQwEg
  YDVQQDEwtCcmlhbiBBY3RvbjCCAbgwggEsBgcqhkjOOAQBMIIBHwKBgQD9f1OBHXUSKVLfSpwu7OTn9hG3UjzvRADDHj+AtlEm
  aUVdQCJR+1k9jVj6v8X1ujD2y5tVbNeBO4AdNG/yZmC3a5lQpaSfn+gEexAiwk+7qdf+t8Yb+DtX58aophUPBPuD9tPFHsMCN
  VQTWhaRMvZ1864rYdcq7/IiAxmd0UgBxwIVAJdgUI8VIwvMspK5gqLrhAvwWBz1AoGBAPfhoIXWmz3ey7yrXDa4V7l5lK+7+jr
  qgvlXTAs9B4JnUVlXjrrUWU/mcQcQgYC0SRZxI+hMKBYTt88JMozIpuE8FnqLVHyNKOCjrh4rs6Z1kW6jfwv6ITVi8ftiegEkO
  8yk8b6oUZCJqIPf4VrlnwaSi2ZegHtVJWQBTDv+z0kqA4GFAAKBgQDRGYtLgWh7zyRtQainJfCpiaUbzjJuhMgo4fVWZIvXHaS
  HBU1t5w//S0lDK2hiqkj8KpMWGywVov9eZxZy37V26dEqr/c2m5qZ0E+ynSu7sqUD7kGx/zeIcGT0H+KAVgkGNQCo5Uc0koLRW
  YHNtYoIvt5R3X6YZylbPftF/8ayWTALBgcqhkjOOAQDBQADLwAwLAIUAKYCp0d6z4QQdyN74JDfQ2WCyi8CFDUM4CaNB+ceVXd
  KtOrNTQcc0e+t`,

  key:
    'eQV5aq/Cg63Gsq1sshN9T3gh+UUp0wIw0xgHYT1bnCjEqOJQKCRrWxdAe2yvsDeCJL+Y4G3PRD2HUF7oUgiGo8vGlNJOaux26k+A2F3hj8A=',

  businessKey:
    'VROA1coOL6M5ywTDPnPB/6CwjpIl2UjqEbIDpuf4TtgbPMj9sEhhi3gqtaG1PM/Jy4VODs6UQE7SMLcqzf/XVQ==',
  businessVersion: '2.21.15.20',
  businessClassMd5: '/ytCzbMZx+YYOXS6fB0pcg==',

  osName: 'Android',
  osVersion: '8.0.0',
  deviceName: 'Pixel_4a_(5G)',
  manufacturer: 'Googole',
  buildVersion: 'google-user 7.1.2 20171130.276299 release-keys',

  domain: 's.whatsapp.net',
  endpoints: [
    ['e1.whatsapp.net', 443],
    ['e2.whatsapp.net', 443],
    ['e3.whatsapp.net', 443],
    ['e4.whatsapp.net', 443],
    ['e5.whatsapp.net', 443],
    ['e6.whatsapp.net', 443],
    ['e7.whatsapp.net', 443],
    ['e8.whatsapp.net', 443],
    ['e9.whatsapp.net', 443],
    ['e10.whatsapp.net', 443],
    ['e11.whatsapp.net', 443],
    ['e12.whatsapp.net', 443],
    ['e13.whatsapp.net', 443],
    ['e14.whatsapp.net', 443],
    ['e15.whatsapp.net', 443],
    ['e16.whatsapp.net', 443],
  ],
  whatsappServer: 's.whatsapp.net',
  whatsappGroupServer: 'g.us',
  PREVIEW_WIDTH: 64,
  PREVIEW_HEIGHT: 64,
  getEndPoint() {
    const len = this.endpoints.length;
    const endpoint = this.endpoints[Math.floor(Math.random() * len)];
    return {
      host: endpoint[0],
      port: 5222,
    };
  },
  getToken(phoneNumber) {
    const keyDecoded = Buffer.from(this.key, 'base64');
    const sigDecoded = Buffer.from(this.signature, 'base64');
    const clsDecoded = Buffer.from(this.md5Class, 'base64');
    const data = Buffer.concat([sigDecoded, clsDecoded, Buffer.from(phoneNumber)]);
    const opad = Buffer.alloc(64);
    const ipad = Buffer.alloc(64);
    for (let i = 0; i < 64; i++) {
      opad[i] = 0x5c ^ keyDecoded[i];
      ipad[i] = 0x36 ^ keyDecoded[i];
    }
    const subHash = crypto
      .createHash('sha1')
      .update(Buffer.concat([ipad, data]))
      .digest();
    const hash = crypto
      .createHash('sha1')
      .update(Buffer.concat([opad, subHash]))
      .digest();
    const result = hash.toString('base64');
    return result;
  },

  // ...globalConfig,
};
