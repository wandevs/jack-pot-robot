// const path = require('path');
// require("dotenv").config({path: `${__dirname}/../../.env.local`});
const abiJackPot = require('../../abis/JacksPot');
const log = require('./log');
const myValidators = require('./validators');
const wanHelper = require('./wanchain-helper');
const wanChain = require(`./${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./${process.env.CHAIN_ENGINE}`).web3;
log.info("lib wan chain init");

const email = require('./email');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

/////////////////////////////////////////////////////////
// JackPot
class JackPot {
    constructor() {
        process.env.JACKPOT_ADDRESS = process.env.JACKPOT_ADDRESS.toLowerCase();
        process.env.JACKPOT_OPERATOR_ADDRESS = process.env.JACKPOT_OPERATOR_ADDRESS.toLowerCase();
        process.env.JACKPOT_OPERATOR_PVKEY = process.env.JACKPOT_OPERATOR_PVKEY.toLowerCase();

        this.contract = new web3.eth.Contract(abiJackPot, process.env.JACKPOT_ADDRESS);
        this.perMaxAmount = web3.utils.toBN(web3.utils.toWei(process.env.Delegator_Per_Max_Amount));
    }

    //////////
    // robot operator
    async doOperator(opName, data, value, count = 7, privateKey = process.env.JACKPOT_OPERATOR_PVKEY, address = process.env.JACKPOT_OPERATOR_ADDRESS) {
        log.debug(`do operator: ${opName}`);
        const nonce = await wanChain.getTxCount(address);
        const rawTx = wanHelper.signTx(nonce, data, privateKey, value);
        const txHash = await wanChain.sendRawTxByWeb3(rawTx);
        log.info(`${opName} hash: ${txHash}`);
        let receipt = null;
        let tryTimes = 0;
        do {
            await sleep(5000);
            receipt = await wanChain.getTransactionReceipt(txHash);
            tryTimes ++;
        } while (!receipt && tryTimes < count);
        if (!receipt) {
            const content = `${opName} failed to get receipt, tx=${txHash} receipt, data: ${data}, nonce:${nonce}`;
            log.error(content);
            throw content;
        }

        log.debug(`${opName} receipt: ${JSON.stringify(receipt)}`);
        return  { status: receipt.status, logs: receipt.logs};
    }

    async update() {
        const data = this.contract.methods.update().encodeABI();
        const result = await this.doOperator(this.update.name, data);

        if (result.status) {
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

    async setValidator(validator, current = null) {
        if (current) {
            if (validator === current) {
                return;
            }
        }
        const data = this.contract.methods.setValidator(validator).encodeABI();
        log.info(`changing validator from ${current} to ${validator}`);
        return await this.doOperator(this.setValidator.name, data);
    }

    /////////////////////////
    // logical check contractBalance should bigger than poolInfo.demandDepositPool
    async balanceCheck() {
      const contractBalance = await wanChain.getBalance(process.env.JACKPOT_ADDRESS);
      const poolInfo = await wanChain.getScVar("poolInfo", this.contract, abiJackPot);
      console.log(`contractBalance=${contractBalance}, demandDepositPool=${poolInfo.demandDepositPool}`);
      return web3.utils.toBN(contractBalance).cmp(web3.utils.toBN(poolInfo.demandDepositPool)) >= 0;
    }

    async isClose() {
        return await wanChain.getScVar("closed", this.contract, abiJackPot);
    }

    async runDelegateOut(validatorAddr) {
        const data = this.contract.methods.runDelegateOut(validatorAddr).encodeABI();
        return await this.doOperator(this.runDelegateOut.name, data);
    }

    async getValidatorsInfo() {
        const infos = await wanChain.getScVar("validatorsInfo", this.contract, abiJackPot);
        infos.validatorsCount = parseInt(infos.validatorsCount);
        infos.currentValidator = infos.currentValidator.toLowerCase();
        infos.withdrawFromValidator = infos.withdrawFromValidator.toLowerCase();
        return infos;
    }

    //  if a validator want to exit, send a email, and delegateOut
    async checkStakerOut () {
        const validatorsInfo = await this.getValidatorsInfo();
        const validatorsAddrs = myValidators; //await this.getAllValidators(validatorsInfo.validatorsCount);
        const blockNumber = await wanChain.getBlockNumber();
        const stakersInfo = await wanChain.getStakerInfo(blockNumber);

        let isDelegateOut = validatorsInfo.withdrawFromValidator !== "0x0000000000000000000000000000000000000000";

        const subject = "Validator is staking out";
        for (let i=0; i<validatorsAddrs.length; i++) {
            const si = stakersInfo.find(s => { return s.address === validatorsAddrs[i]});
            if (si) {
                if (si.nextLockEpochs === 0) {
                    if (!isDelegateOut) {
                        try {
                            await this.contract.methods.runDelegateOut(validatorsAddrs[i]);
                            isDelegateOut = true;
                            await email(subject, `${validatorsAddrs[i]} delegate out success`);
                        } catch(err) {
                            await email(subject, `${validatorsAddrs[i]} delegate out failed : ${err}`);
                        }
                    } else {
                        await email(subject, `${validatorsAddrs[i]} can't delegate out, ${validatorsInfo.withdrawFromValidator} is on delegating out`);
                    }
                }
            } else {
                const content = `${validatorsAddrs[i]} is not a valid validator, maybe already stake out`;
                await email(subject, content);
            }
        }
    }

    async chooseValidator() {
        const validatorsInfo = await this.getValidatorsInfo();

        const blockNumber = await wanChain.getBlockNumber();
        const stakersInfoOrigin = await wanChain.getStakerInfo(blockNumber);
        // delete redeem validator and delegateOut validator
        const stakersInfo = stakersInfoOrigin.filter((stakerInfo)=>{return (stakerInfo.nextLockEpochs !== 0) && (stakerInfo.address !== validatorsInfo.withdrawFromValidator)});

        const isDelegateOut = validatorsInfo.withdrawFromValidator !== "0x0000000000000000000000000000000000000000";

        let candidates = myValidators;
        let validCandidates = [];

        // check the candidate
        for (let i=0; i<candidates.length; i++) {
            const addr = candidates[i];
            const info = stakersInfo.find(s => s.address === addr);
            if (info) {
                const client = info.clients.find(e => e.address === process.env.JACKPOT_ADDRESS.toLowerCase());
                let amount = web3.utils.toBN(0);
                if (client) {
                    amount = web3.utils.toBN(client.amount);
                }
                validCandidates.push({addr, amount});
                // if amount < 20000, choose it
                if (amount.cmp(this.perMaxAmount) === -1) {
                    await this.setValidator(addr, validatorsInfo.currentValidator);
                    return true;
                }
            }
        }

        // all failed ? choose the biggest delegate out, choose the smallest to be the candidate, if none, return false
        if (!isDelegateOut) {
            if (validCandidates.length > 1) {
                validCandidates.sort((a, b) => { return a.amount.cmp(b.amount);});
                await this.runDelegateOut(validCandidates.pop().addr);
            }
        }
        if (validCandidates.length > 0) {
            await this.setValidator(validCandidates[0].addr, validatorsInfo.currentValidator);
            return true;
        } else {
            return false;
        }
    }

    ////////////////////////////////////////////
    /// other function for test
    async buy(codes, amounts) {
        let total = web3.utils.toBN(0);
        amounts.forEach((a,index,theArray) => {const wei = web3.utils.toWei(web3.utils.toBN(a)); theArray[index] = '0x' + wei.toString('hex');  total = total.add(wei)} );
        codes.forEach((a,index,theArray) => {theArray[index] = a } );
        const data = this.contract.methods.buy(codes, amounts).encodeABI();
        return await this.doOperator(this.buy.name, data, '0x' + total.toString('hex'));
    }

    async redeem(codes) {
        const data = this.contract.methods.redeem(codes).encodeABI();
        return await this.doOperator(this.redeem.name, data);
    }

    async subsidyIn(amount) {
      const data = this.contract.methods.subsidyIn().encodeABI();
      // const total = web3.utils.toWei(web3.utils.toBN(amount));
      return await this.doOperator(this.subsidyIn.name, data, '0x' + amount.toString('hex'));
    }

    async getPendingAmount() {
      return await wanChain.getScFun("getPendingAmount", [], this.contract, abiJackPot);
    }

  async getOperator() {
      return await wanChain.getScVar("operator", this.contract, abiJackPot);
  }

  parseEventLotteryLog(log) {
    return this.contract._decodeEventABI(log);
  }
}

const jackPot = new JackPot();

module.exports = jackPot;
