// const path = require('path');
// const log = require('./log');
// require("dotenv").config({path: `${__dirname}/../../.env.local`});
const Web3 = require("web3");
const abiJackPot = require('../../abi/jacks-pot');
const { promisify, sleep } = require("./utils");

/////////////////////////////////////////////////////////
// Web3
class WanChain {
  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));
    this.web3_ws = new Web3(new Web3.providers.WebsocketProvider(process.env.WS_URL));
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

  async getScVar(name, contract, abi) {
    return await contract.methods[name]().call();
  }

  async getScFun(name, args, contract, abi) {
    return await contract.methods[name](...args).call();
  }

  async getBlockNumber() {
    return await this.web3.eth.getBlockNumber();
  };

  async getTransactionReceipt(txHash) {
    return await this.web3.eth.getTransactionReceipt(txHash);
  }

  async getStakerInfo(blockNumber) {
    return await this.web3.pos.getStakerInfo(blockNumber);
  };

  async estimateGas(from, to, value, data) {
    return await this.web3.eth.estimateGas({from, to, value, data});
  }

  closeEngine() {
  }

  // get txs on address between [fromBlock, toBlock]
  async getTxsBetween(address, from, to) {
    // scan all blocks
    const blocksPromise = [];
    for (let j = from; j <= to; j++) {
      // blocksPromise.push(new promisify(web3.eth.getBlock, [j, true], web3.eth));
      blocksPromise.push(new promisify(this.web3.eth.getBlock, [j, true], this.web3.eth));
    }
    const blocks = await Promise.all(blocksPromise);

    // scan all jackpot txs
    const receiptsPromise = [];
    blocks.forEach((block) => {
      if (block.transactions) {
        block.transactions.forEach(tx => {
          if (tx.to !== null && address === tx.to.toLowerCase()) {
            receiptsPromise.push(new promisify(this.web3.eth.getTransactionReceipt, [tx.hash], this.web3.eth));
          }
        })
      }
    })
    const receipts = await Promise.all(receiptsPromise);
    if (receipts.length > 1) {
      receipts.sort((a, b) => {
        if (a.blockNumber < b.blockNumber) {
          return -1;
        } else if (a.blockNumber > b.blockNumber) {
          return 1;
        } else if (a.blockNumber === b.blockNumber) {
          a.transactionIndex > b.transactionIndex ? 1 : -1;
        }
      })
    }
    return receipts;
  }

  ///////////////////////////////////////////////////////////
  // those are for test
  async getRandom(epochId, blockNumber) {
    return await this.web3.pos.getRandom(epochId, blockNumber);
  }

  async getEpochID() {
    return await this.web3.pos.getEpochID();
  }

  async getTimeByEpochID(epochId) {
    return await this.web3.pos.getTimeByEpochID(epochId);
  }

}

const wanChain = new WanChain();

module.exports = {
  wanChain,
  web3: wanChain.web3,
  web3_ws: wanChain.web3_ws,
};
