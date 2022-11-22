const IqProtocolEntity = require('./IqProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');

const config = require('../config');

class SetKeysIqProtocolEntity extends IqProtocolEntity {
  constructor(identityKey, signedPreKey, preKeys, djbType, registrationId = null) {
    super('encrypt', null, 'set', config.WHATSAPP_SERVER);
    this.setProps(identityKey, signedPreKey, preKeys, djbType, registrationId);
  }

  setProps(identityKey, signedPreKey, preKeys, djbType, registrationId = null) {
    this.preKeys = preKeys;
    this.identityKey = identityKey;
    this.registration = registrationId;
    this.djbType = Number(djbType);
    this.signedPreKey = signedPreKey;
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

  toProtocolTreeNode() {
    const node = super.toProtocolTreeNode();
    const identityNode = new ProtocolTreeNode(
      'identity',
      null,
      null,
      Buffer.from(this.identityKey).slice(1)
    );
    const listNode = new ProtocolTreeNode('list');
    const keyNodes = [];
    for (let i = 0; i < this.preKeys.length; i++) {
      const pk = this.preKeys[i];
      const { keyId } = pk;
      const keyNode = new ProtocolTreeNode('key');
      keyNode.addChild(new ProtocolTreeNode('id', null, null, this.adjustId(keyId)));
      keyNode.addChild(
        new ProtocolTreeNode('value', null, null, Buffer.from(pk.keyPair.pubKey).slice(1))
      );
      keyNodes.push(keyNode);
    }
    listNode.addChildren(keyNodes);
    const regNode = new ProtocolTreeNode(
      'registration',
      null,
      null,
      this.adjustId(this.registration, 8)
    );
    const typeNode = new ProtocolTreeNode('type', null, null, String.fromCharCode(this.djbType));

    const { keyId, keyPair, signature } = this.signedPreKey;
    const skeyNode = new ProtocolTreeNode('skey', null, [
      new ProtocolTreeNode('id', null, null, this.adjustId(keyId)),
      new ProtocolTreeNode('value', null, null, Buffer.from(keyPair.pubKey).slice(1)),
      new ProtocolTreeNode('signature', null, null, Buffer.from(signature)),
    ]);
    node.addChildren([listNode, identityNode, regNode, typeNode, skeyNode]);
    return node;
  }
}

module.exports = SetKeysIqProtocolEntity;
