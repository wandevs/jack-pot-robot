////////////////////////////////////////////////////////////////////////////////
// send customers WAN
const wanChain = require(`../src/lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`../src/lib/${process.env.CHAIN_ENGINE}`).web3;
const keys = require('../keys/key-pairs.json');
const signTx = require('./lib/wanchain-helper').signTx;
const moneyPrvKey = "16d7310d822141b3a4382876261443c4773c7c5b542586a0594be3eb2f300d7e";
const moneyPrvAddress = "0xcf696d8eea08a311780fb89b20d4f0895198a489";
const moneyPrvKeyBuffer = Buffer.from(moneyPrvKey, 'hex');
const BigNumber = require("bignumber.js");

async function signSend(nonce, i) {
  if (i > 0) {
    const value = "0x" + new BigNumber(web3.utils.toWei(process.env.WAN_TO_SEND).toString()).toString(16);
    const singedData = signTx(30000, nonce, '0x', moneyPrvKeyBuffer, value, keys[keys.length - i].address)
    const txHash = await wanChain.sendRawTxByWeb3(singedData);
    console.log(`hash:${txHash}, nonce:${nonce}`);
    signSend(nonce + 1, i - 1);
  }
}

setTimeout( async () => {
  const nonce = await wanChain.getTxCount(moneyPrvAddress);
  await signSend(nonce, keys.length);
}, 0);
