const { Whatsapp, WhatsappServer } = require('../src/index');

const main = async () => {
  const whatsapp = new Whatsapp({
    mongodb: 'mongodb://localhost:27017/whatsapp',
  });
  await whatsapp.init({
    mobile: '34611649553',
    proxy: {
      host: '127.0.0.1',
      port: 1086,
    },
  });
  let res = null;

  // get sms code
  // res = await whatsapp.sms();

  // use sms code to register
  // res = await whatsapp.register({ code: '352-002' });

  // if the registration is successful, you can log in directly
  res = await whatsapp.login();

  whatsapp.on('message', message => {
    console.log('on message', message);
  });

  // send text message
  res = await whatsapp.sendContactTextMessage({
    jid: '34633786770',
    message: 'test hello',
  });

  console.log('res', res);
};

main();
