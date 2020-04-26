const abiJackPot = require('./abis/JacksPot');
const WanTx = require('wanchainjs-tx');
const path = require('path');
require("dotenv").config({path: __dirname + '/.env.local'});

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

const sendRawTxByWeb3 = (singedData) => {
  return new Promise((resolve, reject) => {
    if (web3.currentProvider.connected) {
      web3.eth.sendSignedTransaction(singedData, (error, hash) => {
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

const getTxCount = async (addr) => {
  return await web3.eth.getTransactionCount(addr);
};

const signTx = (nonce, data, prvKey) => {
  const txParams = {
    Txtype: 0x01,
    nonce: nonce,
    gasPrice: process.env.GASPRICE,
    gasLimit: process.env.GASLIMIT,
    to: process.env.JACKPOT_ADDRESS,
    value: '0x00',
    data: data,
    chainId: parseInt(process.env.CHAIN_ID, 16),
  };
  console.log(JSON.stringify(txParams));
  const privateKey = Buffer.from(prvKey, 'hex');

  const tx = new WanTx(txParams);
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return '0x' + serializedTx.toString('hex');
};

const sleep = m => new Promise(r => setTimeout(r, m));

class JackPot {
  constructor() {
    this.contract = new web3.eth.Contract(abiJackPot, process.env.JACKPOT_ADDRESS);
    this.opName = "";
  }

  //////////
  // robot operator
  async doOperator(opName, data) {
    if (this.opName !== "") {
      throw this.opName + " failed, please fix it first!";
    }
    this.opName = opName;
    const nonce = await getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS);
    const rawTx = signTx(nonce, data, process.env.JACKPOT_OPERATOR_PVKEY);
    const txHash = await sendRawTxByWeb3(rawTx);
    console.log(this.opName + " hash:" + txHash);
    let receipt = null;
    do {
      await sleep(5000);
      receipt = await web3.eth.getTransactionReceipt(txHash);
    } while (!receipt);
    console.log(this.opName + " receipt:" + JSON.stringify(receipt));
    this.opName = "";
    return receipt.status;
  }

  async update() {
    const data = this.contract.methods.update().encodeABI();
    return await this.doOperator(this.update.name, data);
  }

  async open() {
    const data = this.contract.methods.open().encodeABI();
   return await this.doOperator(this.open.name, data);
  }

  async close() {
    const data = this.contract.methods.close().encodeABI();
    return await this.doOperator(this.close.name, data);
  }

  async runDelegateIn() {
    const data = this.contract.methods.runDelegateIn().encodeABI();
    return await this.doOperator(this.runDelegateIn.name, data);
  }

  async lotterySettlement() {
    const data = this.contract.methods.lotterySettlement().encodeABI();
    return await this.doOperator(this.lotterySettlement.name, data);
  }
}

const jackPot = new JackPot();

// setTimeout( async () => {
//   await jackPot.open();
//   await jackPot.update();
//   await jackPot.lotterySettlement();
//   await jackPot.close();
//   await jackPot.runDelegateIn();
// }, 0);

module.exports = {
  sendRawTxByWeb3,
  getTxCount,
  jackPot
};