For business cooperation or customization needs, please contact the following email: yisbug@qq.com

### About

[中文](README_CN.md)

[English](README.md)

This is a WhatsApp communication protocol SDK based on WhatsApp Android client, which means that you can build any WhatsApp client based on this SDK, or complete some specific requirements.

The latest official version: https://www.whatsapp.com/android/

Latest SDK version: 2.22.21.71

TODO:

- [x] login 2022.10.15
- [x] register 2022.10.31
- [x] send message 2022.11.15

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

  const res = await whatsapp.sms();
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

  const res = await whatsapp.register({ code: '352-002' });
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

  const res = await whatsapp.login();
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

  const res = await whatsapp.login();
  // {status:'success'}
  // {status:'error'}

  res = await whatsapp.sendContactTextMessage({
    jid: '8613666666666',
    message: 'hello world.',
  });
};

main();
```

More example: `test/whatsapp.test.js`
