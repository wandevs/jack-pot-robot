const path = require('path');
const WanTx = require('wanchainjs-tx');
const log = require('./log');
// require("dotenv").config({path: `${__dirname}/../../.env.local`});
const Web3 = require("web3");

/////////////////////////////////////////////////////////
// Web3
class WanChain {
  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));
    this.web3.pos = new (require('./wanchain-pos'))(this.web3);
  }

  sendRawTxByWeb3(singedData) {
    return new Promise((resolve, reject) => {
      if (this.web3.currentProvider.connected) {
        this.web3.eth.sendSignedTransaction(singedData, (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      } else {
        reject("web3 is not connected");
      }
    });
  };

  async getTxCount(addr) {
    return await this.web3.eth.getTransactionCount(addr);
  };

  async unlockAccount(addr, password, duration) {
    return await this.web3.eth.personal.unlockAccount(addr, password, duration);
  }

  async getBalance(addr) {
    return await this.web3.eth.getBalance(addr);
  };

  async getBlockNumber() {
    return await this.web3.eth.getBlockNumber();
  };

  signTx(nonce, data, prvKey, value='0x00') {
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
  };

  async getStakerInfo (blockNumber) {
    return await this.web3.pos.getStakerInfo(blockNumber);
  };
}

const wanChain = new WanChain();

module.exports = {
  wanChain,
  web3: wanChain.web3,
};
