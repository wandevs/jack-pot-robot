const WanTx = require('wanchainjs-tx');
const crypto = require('crypto');
// const ethUtil = require('ethereumjs-util');
const BN = require('bn.js');
const secp256k1 = require('secp256k1');
const secp256k1_N = new BN("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16);
const log = require('./log');
const util = require('ethereumjs-util');

function signTx(nonce, data, prvKey, value='0x00', to = process.env.JACKPOT_ADDRESS) {
  const txParams = {
    Txtype: 0x01,
    nonce: nonce,
    gasPrice: process.env.GASPRICE,
    gasLimit: process.env.GASLIMIT,
    to: to,
    value: value,
    data: data,
    chainId: parseInt(process.env.CHAIN_ID, 16),
  };
  log.info(JSON.stringify(txParams));
  const privateKey = Buffer.from(prvKey, 'hex');

  const tx = new WanTx(txParams);
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return '0x' + serializedTx.toString('hex');
}

function generateKeyPair() {
  const randomBuf = crypto.randomBytes(32);
  if (secp256k1.privateKeyVerify(randomBuf)) {
    const address = util.privateToAddress(randomBuf);
    return { 
      privateKey: util.bufferToHex(randomBuf, 'hex'),
      address: util.bufferToHex(address,'hex')
    };
  } else {
    return generateKeyPair();
  }
}

module.exports = {
  signTx,
  generateKeyPair
};
