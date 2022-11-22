For business cooperation or customization needs, please contact the following email: yisbug@qq.com

If you like this project and are willing to support a cup of coffee, you can donate to the following address, thanks.

USDT-TRC20: TNbqKengUa5w96zaWW2ZMM7HUhWYSZewKR

QR-Code:

![TRC20](trc20.png)

USDT-ERC20: 0x587e97c745de7bab7f6ab979382fa8a83c030d0d

QR-Code:

![ERC20](erc20.png)

If the donation amount exceeds 100 \$, you can get a free technical consultation. For details, please contact us by email. Thank you.

### About

[中文](README_CN.md)

[English](README.md)

This is a WhatsApp communication protocol SDK based on WhatsApp Android client, which means that you can build any WhatsApp client based on this SDK, or complete some specific requirements.

The latest official version: https://www.whatsapp.com/android/

Latest SDK version: 2.22.21.71

#### Updates

2022/11/23

- feat: support recv messages.

2022/11/21

- fix: node_modules/@privacyresearch/libsignal-protocol-typescript/lib/session-record.js
- fix: node_modules/@privacyresearch/curve25519-typescript/lib/built/curveasm.js

How to update:

```
rm -rf node_modules
npm i // or yarn
```

And the repair file of the patches directory will be automatically moved to the node_modules.

### Usage

#### Installation

requires:

- nodejs >= 14.11.0
- mongodb >= 4.0.28

~~You can use npm or yarn to install:~~

```shell
# npm install whatsapp-nodejs
```

For some reasons, the package is removed by npm, so you need to clone the local repository, and then use the npm link command to use this sdk.

```shell
git clone git@github.com:yisbug/whatsapp-nodejs.git
cd whatsapp-nodejs
npm install
cd ../your project
npm link ../whatsapp-nodejs
```

#### Get SMS

```javascript
const { Whatsapp } = require('whatsapp-nodejs');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '8613888888888', // cc is required, for example, china is +86
    proxy: {
      host: '127.0.0.1',
      port: 1080,
      userId: 'test',
      password: 'test',
    },
  });

  let res = null;

  res = await whatsapp.sms();
  // {status:'success'}
  // {status:'error'}
};

main();
```

#### Use SMS Code to register

```javascript
const { Whatsapp } = require('whatsapp-nodejs');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '8613888888888', // cc is required, for example, china is +86
    proxy: {
      host: '127.0.0.1',
      port: 1080,
      userId: 'test',
      password: 'test',
    },
  });

  let res = null;
  res = await whatsapp.register({ code: '352-002' });
  // {status:'success'}
  // {status:'error'}
};

main();
```

#### Login

```javascript
const { Whatsapp } = require('whatsapp-nodejs');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '8613888888888', // cc is required, for example, china is +86
    proxy: {
      host: '127.0.0.1',
      port: 1080,
      userId: 'test',
      password: 'test',
    },
  });

  let res = null;
  res = await whatsapp.login();
  // {status:'success'}
  // {status:'error'}
};

main();
```

#### Send Text Message

```javascript
const { Whatsapp } = require('whatsapp-nodejs');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '8613888888888', // cc is required, for example, china is +86
    proxy: {
      host: '127.0.0.1',
      port: 1080,
      userId: 'test',
      password: 'test',
    },
  });

  let res = null;
  res = await whatsapp.login();
  // {status:'success'}
  // {status:'error'}

  res = await whatsapp.sendContactTextMessage({
    jid: '8613666666666',
    message: 'hello world.',
  });
};

main();
```

#### Recv Message

```javascript
const { Whatsapp } = require('whatsapp-nodejs');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '8613888888888', // cc is required, for example, china is +86
    proxy: {
      host: '127.0.0.1',
      port: 1080,
      userId: 'test',
      password: 'test',
    },
  });

  let res = null;
  res = await whatsapp.login();
  // {status:'success'}
  // {status:'error'}

  whatsapp.on('message', message => {
    console.log('on message', message);
  });
};

main();
```

More example: `test/whatsapp.test.js`
