const ProtocolEntity = require('./ProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');

class RetryKeysProtocolEntity extends ProtocolEntity {
  constructor(
    attrs,
    retryattrs,
    identityKey,
    signedPreKey,
    prekey,
    djbType,
    registrationId = null
  ) {
    super('receipt');
    this.attrs = attrs;
    this.retryattrs = retryattrs;
    this.setProps(identityKey, signedPreKey, prekey, djbType, registrationId);
  }

  setProps(identityKey, signedPreKey, prekey, djbType, registrationId = null) {
    this.prekey = prekey;
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
    const node = super.toTreeNode();

    node.addChild(new ProtocolTreeNode('retry', this.retryattrs));

    const regNode = new ProtocolTreeNode(
      'registration',
      null,
      null,
      this.adjustId(this.registration, 8)
    );
    node.addChild(regNode);

    const listNode = new ProtocolTreeNode('keys');

    const identityNode = new ProtocolTreeNode(
      'identity',
      null,
      null,
      Buffer.from(this.identityKey).slice(1)
    );
    listNode.addChild(identityNode);

    const typeNode = new ProtocolTreeNode('type', null, null, String.fromCharCode(this.djbType));
    listNode.addChild(typeNode);

    // <receipt to='34633786770@s.whatsapp.net' id='3AA424CA821108CD7E9A' type='retry'><retry v='1' count='3' id='3AA424CA821108CD7E9A' t='1664755752'/><registration>PG/m5w==</registration><keys><identity>t2iHpBUd7OcRZetLAMQYcP58MeKxVfJ+NAeLCPVANWo=</identity><type></type><key><id>tHnx</id><value>dTQpFAXCxrP2Or8StvpxcLuxfGJKKTs6/oXOYX63TBc=</value></key><skey><id>
    const { keyId } = this.prekey;
    const keyNode = new ProtocolTreeNode('key');
    keyNode.addChild(new ProtocolTreeNode('id', null, null, this.adjustId(keyId)));

    keyNode.addChild(
      new ProtocolTreeNode('value', null, null, Buffer.from(this.prekey.keyPair.pubKey).slice(1))
    );
    listNode.addChild(keyNode);

    const { keyPair, signature } = this.signedPreKey;
    const skeyNode = new ProtocolTreeNode('skey', null, [
      new ProtocolTreeNode('id', null, null, this.adjustId(this.signedPreKey.keyId)),
      new ProtocolTreeNode('value', null, null, Buffer.from(keyPair.pubKey).slice(1)),
      new ProtocolTreeNode('signature', null, null, Buffer.from(signature)),
    ]);
    listNode.addChild(skeyNode);

    node.addChild(listNode);
    return node;
  }
}

module.exports = RetryKeysProtocolEntity;
