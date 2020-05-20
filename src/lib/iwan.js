const iWanClient = require('iwan-sdk');
const Web3 = require('web3');
const BigNumber = require("bignumber.js");
// require("dotenv").config({path: `${__dirname}/../../.env.local`});

//Subject to https://iwan.wanchain.org

class IWan {
  constructor() {
    const option = {
      url: process.env.IWAN_URL,
      port: parseInt(process.env.IWAN_PORT),
      flag: process.env.IWAN_FLAG,
      version: process.env.IWAN_VERSION,
      timeout: parseInt(process.env.IWAN_TIMEOUT),
    };
    this.apiClient = new iWanClient(process.env.IWAN_APIKEY, process.env.IWAN_SECRETKEY, option);
    this.web3 = new Web3();
  }

  async sendRawTxByWeb3(singedData) {
      return await this.apiClient.sendRawTransaction(process.env.IWAN_CHAINTYPE, singedData);
  };

  async getTxCount(addr) {
    return parseInt(await this.apiClient.getNonce(process.env.IWAN_CHAINTYPE, addr), 16);
  }

  async getBalance(addr) {
    return await this.apiClient.getBalance(process.env.IWAN_CHAINTYPE, addr);
  }

  web0ToWeb1(name, result, contract) {
    if (result instanceof Array) {
      const method = contract.methods[name]();
      const rt = {};
      for (let i=0; i<method._method.outputs.length; i++) {
        const rtType = method._method.outputs[i].type;
        // web0.20 === delegatePool = "1.05e+21", BN not support
        if (rtType === "uint256" || rtType === "uint") {
          rt[i] = new BigNumber(result[i]).toString(10);
        } else {
          rt[i] = result[i];
        }
        rt[method._method.outputs[i].name] = rt[i];
      }
      return rt;
    } else {
      return result;
    }
  }
  async getScVar(name, contract, abi) {
    const result = await this.apiClient.getScVar(process.env.IWAN_CHAINTYPE, process.env.JACKPOT_ADDRESS, name, abi);
    return this.web0ToWeb1(name, result, contract);
  }

  async getScFun(name, args, contract, abi) {
    const result = await this.apiClient.callScFunc(process.env.IWAN_CHAINTYPE, process.env.JACKPOT_ADDRESS, name, args, abi);
    return this.web0ToWeb1(name, result, contract);
  }

  async getBlockNumber() {
    return await this.apiClient.getBlockNumber(process.env.IWAN_CHAINTYPE);
  };

  async getTransactionReceipt(txHash) {
    return await this.apiClient.getTransactionReceipt(process.env.IWAN_CHAINTYPE, txHash);
  }

  async getStakerInfo(blockNumber) {
    return await this.apiClient.getStakerInfo(process.env.IWAN_CHAINTYPE, blockNumber);
  };

  closeEngine() {
    if (!this.apiClient.isClosing() && !this.apiClient.isClosed()) {
      return this.apiClient.close();
    }
  }
  ///////////////////////////////////////////////////////////
  // those are used for test
  async getRandom(epochId, blockNumber) {
    return await this.apiClient.getRandom(process.env.IWAN_CHAINTYPE, epochId, blockNumber);
  }

  async getEpochID() {
    return await this.apiClient.getEpochID(process.env.IWAN_CHAINTYPE);
  }

  async getTimeByEpochID(epochId) {
    return await this.apiClient.getTimeByEpochID(process.env.IWAN_CHAINTYPE, epochId);
  }

}

const iWan = new IWan();

module.exports = {
  wanChain: iWan,
  web3: iWan.web3,
};
