const MessageProtocolEntity = require('./MessageProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');

class EncryptedMessageProtocolEntity extends MessageProtocolEntity {
  /**
   * <message retry="1" from="49xxxxxxxx@s.whatsapp.net" t="1418906418" offline="1" type="text" id="1418906377-1" notify="Tarek Galal">
  <enc type="{{type}}" mediatype="image|audio|location|document|contact" v="{{1 || 2}}">
  HEX:33089eb3c90312210510e0196be72fe65913c6a84e75a54f40a3ee290574d6a23f408df990e718da761a210521f1a3f3d5cb87fde19fadf618d3001b64941715efd3e0f36bba48c23b08c82f2242330a21059b0ce2c4720ec79719ba862ee3cda6d6332746d05689af13aabf43ea1c8d747f100018002210d31cd6ebea79e441c4935f72398c772e2ee21447eb675cfa28b99de8d2013000</enc>
  </message>
   */
  // '<message to='8616571176468-1608555499@g.us' type='text' id='BD61E1D7580F1E33F7B824E1A3941330' phash='2:Wkp/pAJc'>
  constructor(encEntities, _type, messageAttributes) {
    super(_type, messageAttributes);
    this.setEncEntities(encEntities);
  }

  setEncEntities(encEntities = null) {
    this.encEntities = encEntities;
  }

  getEnc(encType) {
    for (let i = 0; i < this.encEntities.length; i++) {
      const enc = this.encEntities[i];
      if (enc.type === encType) return enc;
    }
  }

  getEncEntities() {
    return this.encEntities;
  }

  toProtocolTreeNode() {
    const node = super.toProtocolTreeNode();
    // node.addChild(new ProtocolTreeNode('url_number'));
    const participantsNode = new ProtocolTreeNode('participants');
    for (let i = 0; i < this.encEntities.length; i++) {
      const enc = this.encEntities[i];
      const encNode = enc.toProtocolTreeNode();
      if (encNode.tag === 'to') {
        participantsNode.addChild(encNode);
      } else {
        node.addChild(encNode);
      }
    }
    if (participantsNode.getAllChildren().length) {
      node.addChild(participantsNode);
    }
    return node;
  }
}

module.exports = EncryptedMessageProtocolEntity;
