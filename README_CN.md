商业合作或定制化需求可以联系：yisbug@gmail.com

### 关于

[中文](README_CN.md)

[English](README.md)

这是一个基于 WhatsApp Android 客户端的 WhatsApp 通信协议 SDK，意味着您可以基于这套 SDK 打造任意 WhatsApp 客户端，或者完成一些特定的需求.

官方最新版本：https://www.whatsapp.com/android/

目前 SDK 所支持的最新版本：2.22.21.71

TODO:

- [x] 完成登陆 2022.10.15
- [x] 完成注册 2022.10.31
- [x] 完成收发消息 2022.11.15

### Useage

#### Installation

requires:

- nodejs >= 14.11.0
- mongodb >= 4.0.28

~~You can use npm or yarn to install:~~

```shell
#npm install whatsapp-nodejs
```

由于某些原因，这个库被 npm 仓库移除了，所以只能把代码 cloen 到本地，然后使用 npm link 命令来使用。

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

More example: `test/whatsapp.test.js`
