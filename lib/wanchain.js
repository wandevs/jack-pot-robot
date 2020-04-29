const fs = require('fs');
const path = require('path');
const WanTx = require('wanchainjs-tx');
const abiJackPot = require('../abis/JacksPot');
const log = require('./log');
log.info("lib wan chain init");

require("dotenv").config({path: path.resolve(__dirname, '.env.local') });
const email = require('./email');

/////////////////////////////////////////////////////////
// Web3
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

const getBalance = async (addr) => {
  return await web3.eth.getBalance(addr);
};

const getBlocknumber = async () => {
  return await web3.eth.getBlockNumber();
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
  log.info(JSON.stringify(txParams));
  const privateKey = Buffer.from(prvKey, 'hex');

  const tx = new WanTx(txParams);
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return '0x' + serializedTx.toString('hex');
};

const sleep = m => new Promise(r => setTimeout(r, m));


const loadValidatorsState = () => {
  const file = path.resolve(__dirname, 'data/validatorsState.json');
  if (fs.existsSync(file)){
    return require(file);
  }

  return require('./data.js');
};

const saveValidatorsState = (data) => {
  fs.writeFileSync(path.resolve(__dirname, 'data/validatorsState.json'), JSON.stringify(data, null, 2));
};

/////////////////////////////////////////////////////////
// Pos
class Pos {
  constructor() {
    new (require('./wanchain_pos'))(web3);
  }

  async getStakerInfo (blockNumber) {
    return await web3.pos.getStakerInfo(blockNumber);
  };
}

const pos = new Pos();

/////////////////////////////////////////////////////////
// JackPot
class JackPot {
  constructor() {
    this.contract = new web3.eth.Contract(abiJackPot, process.env.JACKPOT_ADDRESS);
    this.opName = "";
    // todo: read from db
    // this.validatorsState = loadValidatorsState();
    this.perMaxAmount = web3.utils.toBN(web3.utils.toWei(process.env.Delegator_Per_Max_Amount));
  }

  //////////
  // robot operator
  async doOperator(opName, data, count = 72) {
    log.info(`do operator: ${opName}`);
    if (this.opName !== "") {
      const content = `${this.opName} failed, please fix it first!`;
      log.error(content);
      throw content;
    }
    this.opName = opName;
    const nonce = await getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS);
    const rawTx = signTx(nonce, data, process.env.JACKPOT_OPERATOR_PVKEY);
    const txHash = await sendRawTxByWeb3(rawTx);
    log.info(`${this.opName} hash: ${txHash}`);
    let receipt = null;
    let tryTimes = 0;
    do {
      await sleep(5000);
      receipt = await web3.eth.getTransactionReceipt(txHash);
      tryTimes ++;
    } while (!receipt && tryTimes < count);
    if (!receipt) {
      const content = `${this.opName} failed to get receipt, tx=${txHash} receipt, data: ${data}, nonce:${nonce}`;
      log.error(content);
      throw content;
    }

    log.debug(`${this.opName} receipt: ${JSON.stringify(receipt)}`);
    this.opName = "";
    return  { status: receipt.status, logs: receipt.logs};
  }

  async update() {
    const data = this.contract.methods.update().encodeABI();
    const result = await this.doOperator(this.update.name, data);

    if (result.status === 0x1) {
      const logs = result.logs;
      const outOfGasEvent = web3.utils.keccak256("GasNotEnough()");
      const isOutOfGas = logs.find((log) => { log.topics[0] === outOfGasEvent });
      if (isOutOfGas) {
        setTimeout(async () => {
          await this.update();
        }, 10000)
      }
    }
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

  async setValidator(validator) {
    const data = this.contract.methods.setValidator(validator).encodeABI();
    return await this.doOperator(this.setValidator.name, data);
  }

  /////////////////////////
  // logical check contractBalance should bigger than poolInfo.demandDepositPool
  async balanceCheck() {
    const contractBalance = await getBalance(process.env.JACKPOT_ADDRESS);
    const poolInfo = await this.contract.methods.poolInfo().call();
    return contractBalance >= poolInfo.demandDepositPool;
  }

  async isClose() {
    return await this.contract.methods.close;
  }

  async runDelegateOut(validatorAddr) {
    const data = this.contract.methods.runDelegateOut(validatorAddr).encodeABI();
    return await this.doOperator(this.runDelegateOut.name, data);
  }

  async getValidatorsInfo() {
    const infos = await this.contract.methods.validatorsInfo().call();
    infos.validatorsCount = parseInt(infos.validatorsCount);
    console.log(JSON.stringify(infos))
    return infos;
  }

  async getAllValidators(count) {
    let validators = [];
    for (let i = 0; i<count; i++) {
      const addr = await this.contract.methods.validatorsMap(i).call();
      validators.push(addr);
    }
    return validators;
  }

  checkLog() {

  }

  // if staker out
  async checkStakerOut () {
    const validatorsInfo = await this.getValidatorsInfo();
    const validatorsAddrs = await this.getAllValidators(validatorsInfo.validatorsCount);
    const blockNumber = await getBlocknumber();
    const stakersInfo = await pos.getStakerInfo(blockNumber);

    const isDelegateOut = validatorsInfo.withdrawFromValidator !== "0x0000000000000000000000000000000000000000";

    for (let i=0; i<validatorsAddrs.length; i++) {
      for (let j=0; j<stakersInfo.length; j++) {
        if (stakersInfo[j].address === validatorsAddrs[i]) {
          if (stakersInfo[j].nextLockEpochs === 0) {
            const subject = "Validator is staking out";
            if (isDelegateOut) {
              try {
                await this.contract.methods.runDelegateOut(validatorsAddrs[i]);
                const content = `${validatorsAddrs[i]} delegate out success`;
                log.warn(`${subject} ${content}`);
                await email(subject, content);
              } catch(err) {
                const content = `${validatorsAddrs[i]} delegate out failed : ${err}`;
                log.error(subject, content);
                await email(subject, content);
              }
            } else {
              const content = `${validatorsAddrs[i]} can't delegate out, ${validatorsInfo.withdrawFromValidator} is on delegating out`;
              log.warn(`${subject} ${content}`);
              await email(subject, content);
            }
          }
        }
      }
    }
  }

  //
  getDelegateAmount(stakersInfo, validatorAddr, delegatorAddr) {
    for (let i=0; i<stakersInfo.length; i++) {
      if (stakersInfo[i].address === validatorAddr) {
        for (let j=0; j<stakersInfo[i].clients.length; j++) {
          if(stakersInfo[i].clients[j].address === delegatorAddr) {
            return web3.utils.toBN(stakersInfo[i].clients[j].amount);
          }
        }
        const content = `getDelegateAmount failed delegator ${delegatorAddr} not exist in ${validatorAddr}`;
        log.error(content);
        throw content;
      }
    }
    const content = `getDelegateAmount failed validator ${validatorAddr} not exist`;
    log.error(content);
    throw content;
  }

  async chooseValidator() {
    const validatorsInfo = await this.getValidatorsInfo();
    // if only one validator ----- use it
    if (validatorsInfo.validatorsCount <= 1) {
      // not change
      return;
    }

    const validatorsAddrs = await this.getAllValidators(validatorsInfo.validatorsCount);
    const blockNumber = await getBlocknumber();
    let stakersInfo = await pos.getStakerInfo(blockNumber);
    // delete stakeOut validator and delegateOut validator
    stakersInfo = stakersInfo.filter((stakerInfo)=>{return (stakerInfo.nextLockEpochs !== 0) && (stakerInfo.address !== validatorsInfo.withdrawFromValidator)});

    // first select the old one,
    let candidateAddr = null;
    if (validatorsInfo.currentValidator !== "0x0000000000000000000000000000000000000000" &&
        validatorsInfo.currentValidator !== validatorsInfo.withdrawFromValidator) {
      candidateAddr = validatorInfo.currentValidator;
    }
    let candidates = validatorsAddrs.filter(addr=>{return addr !== candidateAddr});
    let index = -1;
    if (candidateAddr == null) {
      // if no candidate, use the old one
      if (candidates.length === 0) {
        log.warn("no validator can be choose");
        return;
      }
      // if no old one, use a candi
      index ++;
      candidateAddr = candidates[index];
    }

    // check the candidate
    let round = web3.utils.toBN(1);
    while (candidateAddr != null) {
      const amount = await this.getDelegateAmount(stakersInfo, candidateAddr, process.env.JACKPOT_ADDRESS);
      // if amount < 20000, choose it
      if (amount.cmp(this.perMaxAmount.mul(round)) === -1) {
        break;
        //else if amount >= 20000,
      } else {
        // find one < 20000
        if (index < candidates.length - 1) {
          index++;
          candidateAddr = candidates[index];
        } else {
          // if all >= 20000,
          // delegate the one
          if (round.cmp(web3.utils.toBN(1)) === 0) {
            await this.runDelegateOut(candidates.pop());
          }
          // try again from 2x20000
          if (candidates.length === 0) {
            candidateAddr = null;
          } else {
            round = round.add(web3.utils.toBN(1));
            index = 0;
            candidateAddr = candidateAddr[index];
          }
        }
      }
    }
    if (candidateAddr === null || candidateAddr === validatorsInfo.currentValidator) {
      return ;
    }

    log.info(`changing validator from ${validatorsInfo.currentValidator} to ${candidateAddr}`);
    await this.setValidator(candidateAddr);
  }
}

const jackPot = new JackPot();

module.exports = {
  sendRawTxByWeb3,
  getTxCount,
  getBalance,
  saveValidatorsState,
  loadValidatorsState,
  pos,
  jackPot
};