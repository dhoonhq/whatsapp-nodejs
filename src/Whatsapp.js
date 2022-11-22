const EventEmitter = require('events');
const initBeforeStart = require('./initBeforeStart');
const utils = require('./lib/utils');
const WARequest = require('./lib/WARequest');

const libsignal = require('./lib/libsignal');

const SocketManager = require('./SocketManager');
const db = require('./db');
const ProtocolTreeNode = require('./packet/ProtocolTreeNode');
const config = require('./config');
const accountStore = require('./store/account');
const Signal = require('./protocol/signal');

const Message = require('./protobuf/pb').Message.Message;

const GetKeysIqProtocolEntity = require('./packet/GetKeysIqProtocolEntity');
const ResultGetKeysIqProtocolEntity = require('./packet/ResultGetKeysIqProtocolEntity');
const EncProtocolEntity = require('./packet/EncProtocolEntity');
const EncryptedMessageProtocolEntity = require('./packet/EncryptedMessageProtocolEntity');

const RetryKeysProtocolEntity = require('./packet/RetryKeysProtocolEntity');
const ProtocolEntity = require('./packet/ProtocolEntity');

const SetKeysIqProtocolEntity = require('./packet/SetKeysIqProtocolEntity');

const { SignalProtocolAddress } = libsignal;
class Whatsapp extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.socketManager = new SocketManager();

    Object.assign(config, opts);

    this.id = 0;
    this.isLogin = false;
    this.mobile = '';
    this.cc = '';
    this.mnc = '';
    this.mcc = '';
    this.proxy = '';
  }

  async init(opts) {
    await initBeforeStart();

    const { mobile, cc, mnc, mcc, proxy } = opts;
    this.opts = opts;

    this.mobile = mobile;
    this.proxy = proxy;
    this.cc = cc;
    this.mnc = mnc;
    this.mcc = mcc;
    this.proxy = proxy;

    this.signal = new Signal(this.mobile);
    await this.signal.init();
  }

  // get sms code
  async sms() {
    const account = await accountStore.initAccount(this.opts);

    const request = new WARequest(this.signal, config, account);
    await request.init();
    if (this.proxy) request.setProxy(this.proxy);
    request.url = 'https://v.whatsapp.net/v2/code?ENC=';
    request.addParam('client_metrics', '{"attempts"%3A1}');
    request.addParam('read_phone_permission_granted', '1');
    request.addParam('offline_ab', '{"exposure"%3A[]%2C"metrics"%3A{}}');
    request.addParam('network_operator_name', '');
    request.addParam('sim_operator_name', '');
    request.addParam('sim_state', '1');

    request.addParam('mcc', utils.fillZero(account.mcc, 3));
    request.addParam('mnc', utils.fillZero(account.mnc, 3));
    request.addParam('sim_mcc', utils.fillZero(account.sim_mcc, 3));
    request.addParam('sim_mnc', utils.fillZero(account.sim_mnc, 3));
    request.addParam('method', 'sms');
    request.addParam('reason', '');
    request.addParam('token', config.getToken(request._p_in));
    request.addParam('hasav', '2');
    request.addParam('id', Buffer.from(account.id, 'base64'));
    request.addParam(
      'backup_token',
      Buffer.from(account.id, 'base64')
        .slice(0, 15)
        .toString('base64')
    );
    let response;
    try {
      response = await request.get();
      console.info('get sms code===>', response);
    } catch (e) {
      console.info(`get sms code failed: ${e.message}`);
      console.log(e.stack);
      throw new Error(e);
    }
    if (response.status === 'ok' || response.status === 'sent') {
      return { status: 'success', data: response };
    }
    return { status: 'error', data: response };
  }

  // use sms code to register
  async register(params) {
    const account = await accountStore.initAccount(this.opts);

    const { code } = params;
    const request = new WARequest(this.signal, config, account);
    await request.init();
    if (this.proxy) request.setProxy(this.proxy);
    request.url = 'https://v.whatsapp.net/v2/register?ENC=';

    request.addParam('client_metrics', '{"attempts"%3A1}');
    request.addParam('entered', '1');
    request.addParam('sim_operator_name', '');
    request.addParam('id', Buffer.from(account.id, 'base64'));
    request.addParam(
      'backup_token',
      Buffer.from(account.id, 'base64')
        .slice(0, 15)
        .toString('base64')
    );
    request.addParam(
      'code',
      String(code)
        .trim()
        .replace('-', '')
    );
    let response;
    try {
      response = await request.get();
      console.info('use code to register ===>', response);
    } catch (e) {
      console.error(`use code to register failed`, e);
      throw new Error(e);
    }
    // {
    //   autoconf_type: 1,
    //   login: '34611093620',
    //   security_code_set: false,
    //   status: 'ok',
    //   type: 'new'
    // }
    if (response.status === 'ok') {
      return { status: 'success', data: response };
    }
    return { status: 'error', data: response };
  }

  async login() {
    try {
      const account = await db.findAccount(this.mobile);
      if (!account) throw new Error('The account does not exist, please check the database');
      account.version = config.version;
      this.socketName = await this.socketManager.initWASocket(this.opts, account);
      this.waSocketClient = this.socketManager.getWASocketClient(this.socketName);
      this.waSocketClient.on('node', node => {
        if (node && node.tag) {
          const tag = node.tag;
          const eventName = `on${String(tag[0]).toUpperCase()}${tag.substr(1)}`;
          if (typeof this[eventName] === 'function') this[eventName](node);
          // 特殊包特殊处理
          if (['success', 'failure'].includes(tag)) {
            this.waSocketClient.emit(tag, node);
          }
        }
      });
      this.waSocketClient.on('destroy', () => {
        if (this.pingTimer) {
          clearTimeout(this.pingTimer);
          this.pingTimer = null;
        }
      });
      await new Promise((resolve, reject) => {
        this.waSocketClient.login();
        this.waSocketClient.once('success', () => {
          console.log('Login success.');
          this.sendPing();
          resolve();
        });
        this.waSocketClient.once('failure', node => {
          const str = node.toString();
          console.log('Login failed.', str);
          reject(new Error(str));
        });
      });
      this.isLogin = true;

      await this.signal.level_prekeys();
      await this.syncPrekeys();
      return { status: 'success' };
    } catch (e) {
      return { status: 'failed', msg: e.message };
    }
  }

  async assertLogin() {
    if (!this.isLogin) throw new Error('need login');
  }

  async sendContactTextMessage(params) {
    const { jid, message } = params;
    await this.assertLogin();

    const messageBuffer = Message.encode(
      Message.create({
        conversation: message,
      })
    ).finish();
    // check session
    const isExists = await this.signal.session_exists(jid);
    if (!isExists) await this.getKeys([jid]);
    // create node
    const encryptData = await this.signal.encrypt(jid, messageBuffer);
    const msgType = encryptData.type === 1 ? 'msg' : 'pkmsg';
    const encNode = new EncProtocolEntity(msgType, 2, Buffer.from(encryptData.body));
    const messageNode = new EncryptedMessageProtocolEntity([encNode], 'text', {
      recipient: utils.normalize(jid),
    }).toProtocolTreeNode();

    const node = await this.sendNode(messageNode);
    // save to db for retry
    await this.signal.storeMessage(
      jid,
      messageNode.getAttr('id'),
      messageNode.attributes,
      messageBuffer.toString('base64')
    );
    return node.toJSON();
  }

  // 同步 prekeys
  async syncPrekeys() {
    const unsentPrekeys = await this.signal.load_unsent_prekeys();
    console.info('load unsent prekeys, nums: ', unsentPrekeys.length);
    // 同步 prekeys
    if (unsentPrekeys && unsentPrekeys.length) {
      const node = await this.setPrekeys(
        this.signal.registrationId,
        this.signal.identityKeyPair.pubKey,
        unsentPrekeys.map(item => item.preKey),
        this.signal.signedPrekey
      );
      if (node.getAttr('type') === 'error') {
        const text = node.getChild('error').getAttr('text');
        const code = Number(node.getChild('error').getAttr('code'));

        console.error(`sync prekeys failed,code:${code},text:${text}`);
      } else {
        await this.signal.set_prekeys_as_sent(unsentPrekeys.map(item => item.keyId));
      }
    }
    return {};
  }

  // 设置 prekey
  async setPrekeys(registrationId, identity, preKeys, signedKey) {
    const setKeyIqNode = new SetKeysIqProtocolEntity(
      identity,
      signedKey,
      preKeys,
      5,
      registrationId
    ).toProtocolTreeNode();
    const node = await this.sendNode(setKeyIqNode);
    return node;
  }

  async getKeys(recipientIds) {
    const getJidNode = new GetKeysIqProtocolEntity(
      recipientIds.map(recipientId => {
        return utils.normalize(recipientId);
      })
    ).toProtocolTreeNode();
    const node = await this.sendNode(getJidNode);
    if (node.getAttributeValue('type') === 'error')
      throw new Error(node.toJSON().children[0].props.text);
    const entity = ResultGetKeysIqProtocolEntity.fromProtocolTreeNode(node);
    const resultJids = entity.getJids();
    for (let i = 0; i < resultJids.length; i++) {
      const jid = resultJids[i];
      const recipient_id = jid.split('@')[0];
      const preKeyBundle = entity.getPreKeyBundleFor(jid);
      await this.signal.create_session(new SignalProtocolAddress(recipient_id, 1), preKeyBundle);
    }
    return node;
  }

  onReceipt(node) {
    const participant = node.getAttr('participant');
    if (participant) {
      return this.onGroupReceipt(node);
    }
    return this.onContactReceipt(node);
  }

  onGroupReceipt(node) {
    const type = node.getAttr('type');
    const from = node.getAttr('from');
    const participant = node.getAttr('participant');
    const id = node.getAttr('id');
    const t = node.getAttr('t');
    const offline = node.getAttr('offline');
    const className = node.getAttr('class');
    if (!type) {
      const o = {
        to: from,
        id,
        participant,
        class: 'receipt',
      };
      if (className) o.class = className;
      if (t) o.t = t;
      if (offline) o.offline = String(offline);
      this.sendAck(o);
      return;
    }
    if (type === 'read') {
      const o = {
        to: from,
        id,
        type,
        participant,
        class: 'receipt',
      };
      if (className) o.class = className;
      if (t) o.t = t;
      if (offline) o.offline = String(offline);
      this.sendAck(o);
      return;
    }
    if (type === 'retry') {
      const o = {
        to: from,
        type: 'retry',
        id,
        participant,
        class: 'receipt',
      };
      this.sendAck(o);
      // this.retrySendGroupMessage(from.split('@')[0], participant.split('@')[0], id);
      return;
    }
    const o = {
      type,
      to: from,
      class: 'receipt',
    };
    if (className) o.class = className;
    if (t) o.t = t;
    if (offline) o.offline = String(offline);
    this.sendAck(o);
  }

  onContactReceipt(node) {
    const type = node.getAttr('type');
    const from = node.getAttr('from');
    const jid = from.split('@')[0];
    const id = node.getAttr('id');
    const t = node.getAttr('t');
    const offline = node.getAttr('offline');
    const className = node.getAttr('class');
    if (!type) {
      if (jid.match('-')) {
        this.sendAck({
          to: from,
          id,
          class: 'receipt',
        });
        return;
      }
      // 收到消息
      const o = {
        to: from,
        id,
        class: 'receipt',
      };
      if (className) o.class = className;
      this.sendAck(o);
      return;
    }
    if (type === 'read') {
      const o = {
        to: from,
        id,
        type,
        class: 'receipt',
      };
      if (className) o.class = className;
      this.sendAck(o);
      // this.sendSimpleNode(node);
      return;
    }
    if (type === 'retry') {
      const o = {
        to: from,
        type: 'retry',
        id,
        class: 'receipt',
      };
      this.sendAck(o);
      this.retrySendContactMessage(jid, id);
      return;
    }
    const o = {
      type,
      to: from,
      class: 'receipt',
    };
    if (className) o.class = className;
    if (t) o.t = t;
    if (offline) o.offline = String(offline);
    this.sendAck(o);
  }

  // 重发消息
  async retrySendContactMessage(jid, id) {
    try {
      const message = await this.signal.loadMessage(jid, id);
      // 最多重试 5 次
      if (message.retry && message.retry >= 5) {
        console.error(
          'RETRY_SEND_MESSAGE',
          { status: 'error', jid, id },
          `max retry nums：${message.retry}`
        );
        return;
      }
      message.retry = (message.retry || 0) + 1;
      await message.save();
      await this.signal.removeSession(jid);
      await this.getKeys([jid]);
      const ciphertext = await this.signal.encrypt(jid, Buffer.from(message.record, 'base64'));
      const msgType = ciphertext.type === 1 ? 'msg' : 'pkmsg';
      const mediaType = message.attrs.type === 'media' ? 'image' : '';
      const encNode = new EncProtocolEntity(msgType, 2, Buffer.from(ciphertext.body), mediaType);
      // encNode.setAttr('count', '1');
      const messageNode = new EncryptedMessageProtocolEntity(
        [encNode],
        message.attrs.type,
        message.attrs
      ).toProtocolTreeNode();
      const node = await this.sendNode(messageNode);
      return node;
    } catch (e) {
      console.debug('retry send message failed', e);
      this.client.send('RETRY_SEND_MESSAGE', { status: 'error', jid, id }, e.message);
    }
  }

  async onMessage(node) {
    const participant = node.getAttr('participant');
    const isGroup = !!participant;
    if (!this.retryOnMessageIds) this.retryOnMessageIds = {};
    if (isGroup) return this.onMessageGroup(node);
    return this.onMessageContact(node);
  }

  async onMessageContact(node) {
    const tag = node.tag;
    const from = node.getAttr('from');
    const jid = from.split('@')[0];
    const type = node.getAttr('type');
    const id = node.getAttr('id');
    const json = node.toJSON();
    const t = node.getAttr('t');

    if (from === 'status@broadcast' || !['text', 'media'].includes(type)) {
      this.sendReceipt({ id, to: from, type: 'read' });
      this.sendAck({ to: from, id, class: 'message', t });
    }
    const encNode = node.getChild('enc');

    try {
      if (!encNode) return;
      const encType = encNode.getAttr('type');
      let message = null;

      if (encType === 'pkmsg') {
        message = await this.handlePreKeyWhisperMessage(jid, encNode, node);
      } else if (encType === 'msg') {
        message = await this.handleWhisperMessage(jid, encNode, node);
      } else if (encType === 'skmsg') {
        message = await this.handleSenderKeyMessage(jid, encNode, node);
      }
      if (message && Object.keys(message).length === 0) {
        throw new Error('message is empty');
      }
      this.sendAck({ to: from, id, class: 'message', t }); // 先回包
      this.emit('message', message);
    } catch (e) {
      console.error(e);
      this.sendAck({ to: from, id, class: 'message', t }); // 先回包
      const count = Number(encNode.getAttr('count')) || 0;
      if (count > 3) return; // 最多重试 5 次。
      if (count === 0) {
        // 请求重新发送消息
        this.sendReceipt(
          {
            to: utils.normalize(jid),
            type: 'retry',
            id,
          },
          [
            new ProtocolEntity('retry', {
              t: node.getAttr('t'),
              id,
              count: '1',
              v: '1',
            }).toTreeNode(),
            new ProtocolEntity(
              'registration',
              null,
              null,
              this.adjustId(this.signal.registrationId, 8)
            ).toTreeNode(),
          ]
        );
      } else {
        const retryNode = new RetryKeysProtocolEntity(
          {
            to: utils.normalize(jid),
            type: 'retry',
            id,
          },
          {
            t: node.getAttr('t'),
            id,
            count: String(count + 1),
            v: '1',
          },
          this.signal.identityKeyPair.pubKey,
          this.signal.signedPrekey,
          this.signal.preKeys[0].preKey,
          5,
          this.signal.registrationId
        ).toProtocolTreeNode();
        this.sendNode(retryNode);
      }
    }
  }

  adjustId(_id, len = 6) {
    let str = Number(_id).toString(16);
    if (str.length >= len) {
      if (str.length % 2 !== 0) {
        str = `0${str}`;
      }
    } else {
      str = new Array(len - str.length + 1).join('0') + str;
    }
    return Buffer.from(str, 'hex');
  }

  async handlePreKeyWhisperMessage(senderJid, encNode, node) {
    console.debug('handlePreKeyWhisperMessage', senderJid);
    const res = await this.signal.decrypt_pkmsg(senderJid, encNode.data, true);
    const buffer = Message.decode(Buffer.from(res)).toJSON();
    await this.checkAndCreateGroupSession(buffer, node);
    return buffer;
  }

  async handleSenderKeyMessage(senderJid, encNode, node) {
    console.debug('handleSenderKeyMessage', senderJid);
    try {
      const res = await this.signal.group_decrypt(
        node.getAttr('from').split('@')[0],
        node.getAttr('participant').split('@')[0],
        encNode.data
      );
      const buffer = Message.decode(Buffer.from(res)).toJSON();
      await this.checkAndCreateGroupSession(buffer, node);
      return buffer;
    } catch (e) {
      await this.signal.removeSenderKey(node.getAttr('from').split('@')[0], senderJid);
      throw new Error(e);
    }
  }

  async handleWhisperMessage(senderJid, encNode, node) {
    console.debug('handleWhisperMessage', senderJid);
    const res = await this.signal.decrypt_msg(senderJid, encNode.data, true);
    const buffer = Message.decode(Buffer.from(res)).toJSON();
    await this.checkAndCreateGroupSession(buffer, node);
    return buffer;
  }

  async checkAndCreateGroupSession(buffer, node) {
    if (buffer.senderKeyDistributionMessage) {
      console.debug('encNode buffer', buffer);
      // await this.manager.group_create_session(
      //   node.getAttr('from').split('@')[0], // groupId
      //   node.getAttr('participant').split('@')[0], // jid
      //   Buffer.from(
      //     buffer.senderKeyDistributionMessage.axolotlSenderKeyDistributionMessage,
      //     'base64'
      //   )
      // );
    }
  }

  // 接收到群消息
  async onMessageGroup(node) {
    const tag = node.tag;
    const from = node.getAttr('from');
    const participant = node.getAttr('participant');
    const notify = node.getAttr('notify'); // pushName
    const type = node.getAttr('type');
    const id = node.getAttr('id');
    const t = node.getAttr('t');

    const gid = from.split('@')[0];
    const jid = participant.split('@')[0];
    const json = node.toJSON();

    this.sendAck({
      to: from,
      id,
      class: 'message',
      participant,
      t,
    });

    if (type !== 'text' && type !== 'media') {
      this.client.send(tag, { status: 'error' }, `not support message type ：${type}`);
      this.sendReceipt({
        id,
        to: from,
        type: 'read',
      });
      return;
    }
    if (from === 'status@broadcast') {
      this.sendReceipt({
        id,
        to: from,
        type: 'read',
      });
    }
  }

  onNotificationPsa(node) {
    this.sendAck({
      id: node.getAttr('id'),
      class: 'notification',
      type: 'psa',
      to: node.getAttr('from'),
      participant: node.getAttr('participant'),
      t: node.getAttr('t'),
    });
  }

  onNotificationEncrypt(node) {
    this.sendAck({
      type: 'encrypt',
      class: 'notification',
      id: node.getAttr('id'),
      to: node.getAttr('from'),
      t: node.getAttr('t'),
    });
  }

  onNotificationGroup(node) {
    this.sendAck({
      type: 'w:gp2',
      id: node.getAttr('id'),
      to: node.getAttr('from'),
      class: 'notification',
      participant: node.getAttr('participant'),
    });
  }

  onNotification(node) {
    const type = node.getAttr('type');
    if (type === 'psa') return this.onNotificationPsa(node);
    if (type === 'encrypt') return this.onNotificationEncrypt(node);
    if (type === 'w:gp2') return this.onNotificationGroup(node); //
    // other type
    this.sendAck(
      {
        type,
        class: 'notification',
        id: node.getAttr('id'),
        to: node.getAttr('from'),
      },
      node.getAllChildren()
    );
  }

  async sendPing() {
    //  <iq id="02" type="get" xmlns="w:p"><ping></ping></iq>
    this.pingTimer = setTimeout(() => {
      this.id++;
      const node = new ProtocolTreeNode(
        'iq',
        {
          type: 'get',
          xmlns: 'w:p',
          id: utils.generateId(this.id || 0),
        },
        [new ProtocolTreeNode('ping')]
      );
      this.sendNode(node);

      this.sendPing();
    }, 1000 * 20 + 1000 * Math.random() * 10);
  }

  async sendAck(attrs) {
    const node = new ProtocolTreeNode('ack', attrs);
    this.sendNode(node);
  }

  async sendReceipt(attrs, children, data) {
    const node = new ProtocolTreeNode('receipt', attrs, children, data);
    this.sendNode(node);
  }

  async sendNode(node) {
    return await this.waSocketClient.sendNode(node);
  }
}

module.exports = Whatsapp;
