const accountStore = require('../src/store/account');
const db = require('../src/db');
const Whatsapp = require('../src/Whatsapp');

const main = async () => {
  //
  const mobile = '123123123123';
  const keyPair = {
    private: Buffer.alloc(32),
    public: Buffer.alloc(32),
  };

  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile,
    proxy: {
      host: '127.0.0.1',
      port: 1086,
    },
  });

  // insert into db
  await accountStore.initAccount({ mobile });
  await db.account.findOneAndUpdate(
    { mobile },
    {
      clientStaticKeypair: Buffer.concat([keyPair.private, keyPair.public]).toString('base64'),
    }
  );

  await whatsapp.login();
};

main();
