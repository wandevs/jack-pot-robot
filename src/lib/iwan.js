const iWanClient = require('iwan-sdk');
const Web3 = require('web3');
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

  sendRawTxByWeb3(singedData) {
    return new Promise((resolve, reject) => {
        this.apiClient.sendRawTransaction(process.env.IWAN_CHAINTYPE, singedData, (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
    });
  };

  // TODO: return with 0x
  async getTxCount(addr) {
    return parseInt(await this.apiClient.getNonce(process.env.IWAN_CHAINTYPE, addr), 16);
  }

  async getBalance(addr) {
    const balance = await this.apiClient.getBalance(process.env.IWAN_CHAINTYPE, addr);
    console.log(`Balance result is ${balance}`);
    return await this.apiClient.getBalance(process.env.IWAN_CHAINTYPE, addr);
  }

  web0toweb1(name, result, contract) {
    if (result instanceof Array) {
      const method = contract.methods[name]();
      const rt = {};
      for (let i=0; i<method._method.outputs.length; i++) {
        rt[i] = result[i];
        rt[method._method.outputs[i].name] = result[i];
      }
      return rt;
    } else {
      return result;
    }
  }
  async getScVar(name, contract, abi) {
    const result = await this.apiClient.getScVar(process.env.IWAN_CHAINTYPE, process.env.JACKPOT_ADDRESS, name, abi);
    return this.web0toweb1(name, result, contract);
  }

  async getScFun(name, args, contract, abi) {
    const result = await this.apiClient.callScFunc(process.env.IWAN_CHAINTYPE, process.env.JACKPOT_ADDRESS, name, args, abi);
    return this.web0toweb1(name, result, contract);
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
