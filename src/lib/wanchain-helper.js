const WanTx = require('wanchainjs-tx');
const log = require('./log');

function signTx(nonce, data, prvKey, value='0x00') {
  const txParams = {
    Txtype: 0x01,
    nonce: nonce,
    gasPrice: process.env.GASPRICE,
    gasLimit: process.env.GASLIMIT,
    to: process.env.JACKPOT_ADDRESS,
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

module.exports = {
  signTx
};
