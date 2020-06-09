// const path = require('path');
// require("dotenv").config({path: `${__dirname}/../../.env.local`});
const abiJackPot = require('../../abi/jacks-pot');
const log = require('./log');
const wanHelper = require('./wanchain-helper');
const wanChain = require(`./${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./${process.env.CHAIN_ENGINE}`).web3;
log.info("lib wan chain init");

const sendMail = require('./email');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

/////////////////////////////////////////////////////////
// JackPot
class JackPot {
    constructor() {
        process.env.JACKPOT_ADDRESS = process.env.JACKPOT_ADDRESS.toLowerCase();
        process.env.JACKPOT_OPERATOR_ADDRESS = process.env.JACKPOT_OPERATOR_ADDRESS.toLowerCase();
        process.env.JACKPOT_OPERATOR_PVKEY = process.env.JACKPOT_OPERATOR_PVKEY.toLowerCase();

        this.myValidators = JSON.parse(process.env.POS_VALIDATORS);
        this.contract = new web3.eth.Contract(abiJackPot, process.env.JACKPOT_ADDRESS);
        this.perMaxAmount = web3.utils.toBN(web3.utils.toWei(process.env.Delegator_Per_Max_Amount));
        this.zeroAmount = web3.utils.toBN(0);
    }

  async logAndSendMail(subject, content, isSend = true) {
    log.error(subject + " : " + content);
    try {
      if (isSend) {
        await sendMail(subject, content);
      }
    } catch (e) {
      log.error(`send mail failed, sub = ${subject}, content = ${content}, err=${e}`);
    }
  }
    //////////
    // robot operator
    async doOperator(opName, data, gasLimit, value, count = 7, privateKey = process.env.JACKPOT_OPERATOR_PVKEY, address = process.env.JACKPOT_OPERATOR_ADDRESS) {
        log.debug(`do operator: ${opName}`);
        const nonce = await wanChain.getTxCount(address);
        const gas = gasLimit ? gasLimit : await wanChain.estimateGas(address, process.env.JACKPOT_ADDRESS, value, data);
        const rawTx = wanHelper.signTx(gas, nonce, data, privateKey, value);
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
        const result = await this.doOperator(this.update.name, data, process.env.GASLIMIT);

        if (result.status) {
            const logs = result.logs;
            const outOfGasEvent = web3.utils.keccak256("GasNotEnough()");
            const isOutOfGas = logs.find((log) => { log.topics[0] === outOfGasEvent });
            if (isOutOfGas) {
                // setTimeout(async () => {
                //     await this.update();
                // }, 0);

                await this.update();
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
        const validatorsAddrs = this.myValidators;
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
                            await this.runDelegateOut(validatorsAddrs[i]);
                            isDelegateOut = true;
                            await this.logAndSendMail(subject, `${validatorsAddrs[i]} delegate out success`);
                        } catch(err) {
                            await this.logAndSendMail(subject, `${validatorsAddrs[i]} delegate out failed : ${err}`);
                        }
                    } else {
                        await this.logAndSendMail(subject, `${validatorsAddrs[i]} can't delegate out, ${validatorsInfo.withdrawFromValidator} is on delegating out`);
                    }
                }
            } else {
                const content = `${validatorsAddrs[i]} is not a valid validator, maybe already stake out`;
                await this.logAndSendMail(subject, content);
            }
        }
    }

    async getValidCandidates() {
        const validatorsInfo = await this.getValidatorsInfo();
        const blockNumber = await wanChain.getBlockNumber();
        const stakersInfoOrigin = await wanChain.getStakerInfo(blockNumber);
        // delete redeem validator and stake out validator
        const stakersInfo = stakersInfoOrigin.filter((stakerInfo)=>{return (stakerInfo.nextLockEpochs !== 0) && (stakerInfo.address !== validatorsInfo.withdrawFromValidator)});
     
        let candidates = this.myValidators;
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

                let availableAmount = web3.utils.toBN(info.amount);
                info.partners.forEach(partner => availableAmount = availableAmount.add(web3.utils.toBN(partner.amount)));
                availableAmount = availableAmount.mul(web3.utils.toBN(10));
                info.clients.forEach(client => availableAmount = availableAmount.sub(web3.utils.toBN(client.amount)));

                validCandidates.push({addr, amount, availableAmount, poolAmount: web3.utils.toBN(web3.utils.toWei(web3.utils.toBN((i + 1) * 20000)))});
            }
        }

        return { validCandidates, withdrawValidator: validatorsInfo.withdrawFromValidator, currentValidator: validatorsInfo.currentValidator };
    }

    async chooseValidator() {
        const { validCandidates, withdrawValidator, currentValidator } = await this.getValidCandidates();

        const isDelegateOut = withdrawValidator !== "0x0000000000000000000000000000000000000000";

        const pendingAmount = web3.utils.toBN(await this.getPendingAmount());

        if (!isDelegateOut) {
            if (pendingAmount.cmp(this.zeroAmount) !== 0) {
                // delegateOut
                let min = web3.utils.toBN(0);
                let outAddress = null;
                let max = web3.utils.toBN(0);
                let maxAddress = null;
                validCandidates.forEach(v => {
                    if (v.amount.cmp(pendingAmount) >= 0) {
                        if ((min.cmp(v.amount) > 0) || (min.cmp(this.zeroAmount) === 0)) {
                            min = v.amount;
                            outAddress = v.addr;
                        }
                    } else {
                        if (v.amount.cmp(max) > 0) {
                            max = v.amount;
                            maxAddress = v.addr;
                        }
                    }
                })
                if (!outAddress) {
                    outAddress = maxAddress;
                    min = max;
                }

                if (outAddress && min.cmp(this.zeroAmount) > 0) {
                    await this.runDelegateOut(outAddress);
                }
                return {isSetValidator: false, isDelegateOut: true};
            }
        } else {
            return {isSetValidator: false, isDelegateOut: true};
        }

        if (validCandidates.length > 0) {
            let next = validCandidates.find((v) => {
                log.debug(`amount = ${v.amount.toString(10)}, pool = ${v.poolAmount.toString(10)}`)
                if (v.amount.cmp(v.poolAmount) < 0) {
                    return true;
                }
            })
            if (!next) {
                next = validCandidates.pop();
            }
            await this.setValidator(next.addr, currentValidator);
            return {isSetValidator: true, isDelegateOut: false};
        }

        return {isSetValidator: false, isDelegateOut: false};
    }

    ////////////////////////////////////////////
    /// other function for test
    async buy(codes, amounts, privateKey, address) {
        let total = web3.utils.toBN(0);
        amounts.forEach((a,index,theArray) => {const wei = web3.utils.toWei(web3.utils.toBN(a)); theArray[index] = '0x' + wei.toString('hex');  total = total.add(wei)} );
        codes.forEach((a,index,theArray) => {theArray[index] = a } );
        const data = this.contract.methods.buy(codes, amounts).encodeABI();
        const value = '0x' + total.toString('hex');
        const nonce = await wanChain.getTxCount(address);
        // const gasLimit = await this.contract.methods.buy(codes, amounts).estimateGas({gas:process.env.GASLIMIT, from: address, value:value});
        const maxGas = parseInt(process.env.GASLIMIT);
        let gasLimit = await wanChain.estimateGas(address, process.env.JACKPOT_ADDRESS, value, data);
        gasLimit = gasLimit + 200000;
        if (gasLimit > maxGas) {
            gasLimit = maxGas;
        }
        const rawTx = wanHelper.signTx(gasLimit, nonce, data, privateKey, value, process.env.JACKPOT_ADDRESS);
        const txHash = await wanChain.sendRawTxByWeb3(rawTx);
        log.info(`buy hash: ${txHash}, count: ${codes.length}`);
    }

    async redeem(codes, privateKey, address) {
        codes.forEach((a,index,theArray) => {theArray[index] = a } );
        const data = this.contract.methods.redeem(codes).encodeABI();
        const nonce = await wanChain.getTxCount(address);
        // const gasLimit = await this.contract.methods.redeem(codes).estimateGas({gas:process.env.GASLIMIT, from: address, value:'0x00'});
        const maxGas = parseInt(process.env.GASLIMIT);
        let gasLimit = await wanChain.estimateGas(address, process.env.JACKPOT_ADDRESS, '0x00', data);
        gasLimit = gasLimit + 200000;
        if (gasLimit > maxGas) {
            gasLimit = maxGas;
        }
        const rawTx = wanHelper.signTx(gasLimit, nonce, data, privateKey, '0x00', process.env.JACKPOT_ADDRESS);
        const txHash = await wanChain.sendRawTxByWeb3(rawTx);
        log.info(`redeem hash: ${txHash}, codes: ${JSON.stringify(codes)}`);
    }

    async subsidyIn(amount) {
        const data = this.contract.methods.subsidyIn().encodeABI();
        return await this.doOperator(this.subsidyIn.name, data, null, '0x' + amount.toString('hex'));
    }
    async subsidyOut() {
        const data = this.contract.methods.subsidyOut().encodeABI();
        return await this.doOperator(this.subsidyOut.name, data, null, '0x00');
    }

    async getPendingAmount() {
      return await wanChain.getScFun("getPendingAmount", [], this.contract, abiJackPot);
    }

    async getUserCodeList(address) {
      return await wanChain.getScFun("getUserCodeList", [address], this.contract, abiJackPot);
    }

  async getOperator() {
      return await wanChain.getScVar("operator", this.contract, abiJackPot);
  }

  //////////////
//   getStorageAt(address: string, position: number | BigNumber | BN | string): Promise<string>;
//   getStorageAt(
//       address: string,
//       position: number | BigNumber | BN | string,
//       defaultBlock: BlockNumber
//   ): Promise<string>;
//   getStorageAt(
//       address: string,
//       position: number | BigNumber | BN | string,
//       callback?: (error: Error, storageAt: string) => void
//   ): Promise<string>;
//   getStorageAt(
//       address: string,
//       position: number | BigNumber | BN | string,
//       defaultBlock: BlockNumber,
//       callback?: (error: Error, storageAt: string) => void
//   ): Promise<string>;

// struct UintData {
//     mapping(bytes => mapping(bytes => uint))           _storage;
// }
// 0
// owner
// 1 - 5
// BasicStorageLib.UintData    internal uintData; ==> UintData uintData
// BasicStorageLib.BoolData    internal boolData;
// BasicStorageLib.AddressData internal addressData;
// BasicStorageLib.BytesData   internal bytesData;
// BasicStorageLib.StringData  internal stringData;
// 6
// uint256 public maxCount = 50;
// 7
// uint256 public minAmount = 10 ether;
// 8
// uint256 public minGasLeft = 100000;
// 9
// uint256 public firstDelegateMinValue = 100 ether;
// 10 { uint256 prize; uint256 codeCount; mapping(uint256 => uint256) indexCodeMap; mapping(uint256 => uint256) codeIndexMap; mapping(uint256 => uint256) codeAmountMap; }
// mapping(address => UserInfo) public userInfoMap;
// 11 { uint256 addrCount; mapping(uint256 => address) indexAddressMap; mapping(address => uint256) addressIndexMap; }
// mapping(uint256 => CodeInfo) public indexCodeMap;
// 12
// uint256 public pendingRedeemStartIndex;
// 13
// uint256 public pendingRedeemCount;
// 14
// mapping(uint256 => PendingRedeem) public pendingRedeemMap;
// 15
// mapping(address => mapping(uint256 => uint256)) public pendingRedeemSearchMap;
// 16
// uint256 public pendingPrizeWithdrawStartIndex;
// 17
// uint256 public pendingPrizeWithdrawCount;
// 18
// mapping(uint256 => address) public pendingPrizeWithdrawMap;
// 19 - 20 - 21
// ValidatorsInfo public validatorsInfo;
// 22
// mapping(uint256 => address) public validatorsMap;
// 23
// mapping(address => uint256) public validatorIndexMap;
// 24
// mapping(address => uint256) public validatorsAmountMap;
// 25
// uint256 public delegateOutAmount;
// 26 - 27 - 28 - 29
// PoolInfo public poolInfo;
// 30 - 31 - 32 - (33 - 34)
// SubsidyInfo public subsidyInfo;
// 35
// mapping(address => uint256) public subsidyAmountMap;
// 36
// uint256 public feeRate = 0;
// 37  0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8
// address public operator;
// 37 --- 第41位, 0x0000000000000000000000019da26fc2e1d6ad9fdd46138906b0104ae68a65d8
// bool public closed = false;
// 38
// uint256 public maxDigital = 10000;
// 39
// uint256 public currentRandom;
// 40
// address public posPrecompileAddress = address(0xda);
// 41
// address public randomPrecompileAddress = address(0x262);
// 41 --- 第41位， 0x0000000000000000000000010000000000000000000000000000000000000262
// bool private _notEntered;

// contract C {
//     struct S { uint a; uint b; }
//     uint x;
//     mapping(uint => mapping(uint => S)) data;
// }
// data[4][9].b  => keccak256(uint256(9) . keccak256(uint256(4) . uint256(1))) + 1
// keccak256(key2, keccak256(key1 + slot)) + offset
  async getScMap(key, slt) {
    const sltStr = slt.toString();
    const slot = "0".repeat(64 - sltStr.length) + sltStr;
    
    const result = await web3.eth.getStorageAt(
        process.env.JACKPOT_ADDRESS,
        // web3.utils.sha3(key + slot, { encoding: 'hex' })
        slot
    );

    return result;
  }
}

const jackPot = new JackPot();

module.exports = jackPot;
