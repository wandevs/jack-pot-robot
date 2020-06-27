const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const path = require('path');
const fs = require('fs');
const db = require('./lib/sqlite_db');
const { sleep } = require('./lib/utils');
const wanchain = require('./lib/wanchain');

async function checkBalance() {
  // emit FeeSend(owner(), feeAmount)
  // balance =   buy   + runDelegateOut   + subsidy       + posPrize（暂时无法得到）
  //          - redeem - runDelegateIn    - subsidyRefund - feeAmount              - prizeWithdraw
  //
  // buy = emit Buy(msg.sender, msg.value, codes, amounts);
  // runDelegateOut = DelegateOut(validator, delegateOutAmount)  ===== delegateOutAmount, 只有记账，可能延迟到账, update时，demandDepositPool会增加，delegateOutAmount会置0
  // DelegateIn = emit DelegateIn(validatorsInfo.currentValidator, delegateAmount)
  // redeem = user.transfer(totalAmount);
  // subsidyRefund = SubsidyRefund(refundingAddress, singleAmount)
  // feeAmount => FeeSend(owner(), feeAmount)

  // update后 =》        prizePool + delegatePool + demandDepositPool  =   balance
}


const buyEvent = web3.utils.keccak256('Buy(address,uint256,uint256[],uint256[])');
const redeemEvent = web3.utils.keccak256('Redeem(address,bool,uint256[],uint256)');
const gasNotEnoughEvent = web3.utils.keccak256('GasNotEnough()');
const prizeWithdrawEvent = web3.utils.keccak256('PrizeWithdraw(address,bool,uint256)');
const updateSuccessEvent = web3.utils.keccak256('UpdateSuccess()');
const subsidyRefundEvent = web3.utils.keccak256('SubsidyRefund(address,uint256)');
const randomGenerateEvent = web3.utils.keccak256('RandomGenerate(uint256,uint256)');
const lotteryResultEvent = web3.utils.keccak256('LotteryResult(uint256,uint256,uint256,address[],uint256[])');
const feeSendEvent = web3.utils.keccak256('FeeSend(address,uint256)');
const delegateOutEvent = web3.utils.keccak256('DelegateOut(address,uint256)');
const delegateInEvent = web3.utils.keccak256('DelegateIn(address,uint256)');
const subsidyInEvent = web3.utils.keccak256('SubsidyIn(address,uint256)');
const ownershipTransferredEvent = web3.utils.keccak256('OwnershipTransferred(address,address)');
const upgradedEvent = web3.utils.keccak256('Upgraded(address)');

// event delegateIn(address indexed sender, address indexed posAddress, uint indexed v)
const posDelegateInEvent = web3.utils.keccak256('delegateIn(address,address,uint256)');
// event delegateOut(address indexed sender, address indexed posAddress)
const posDelegateOutEvent = web3.utils.keccak256('delegateOut(address,address)');

// update
function updateUserBalance(bAdd, amount, user, userAddress) {
  if (user) {
    const oldBalance = web3.utils.toBN(user.balance);
    const deltaBalance = web3.utils.toBN(amount);
    if (bAdd) {
      user.balance = oldBalance.add(deltaBalance).toString(10)
    } else {
      if (oldBalance.cmp(deltaBalance) >= 0) {
        user.balance = oldBalance.sub(deltaBalance).toString(10)
      } else {
        throw `user: ${JSON.stringify(user)} balance not enough`;
      }
    }
    db.updateUser(user);
  } else {
    if (bAdd) {
      const newUser = {address: userAddress.toLowerCase(), balance: amount}
      db.insertUser(newUser);
      return newUser;
    } else {
      throw `user: ${userAddress} balance not enough`;
    }
  }
  return user;
}

function updateContractBalance(bAdd, amount) {
  const contractUser = db.getUser(process.env.JACKPOT_ADDRESS);
  updateUserBalance(bAdd, amount, contractUser, process.env.JACKPOT_ADDRESS);
  return contractUser;
}

function saveEvent(transactionHash, blockNumber, event, amount, from, fromBalance, to, toBalance) {
  try {
    db.insertBalanceChange({
      transactionHash: transactionHash,
      blockNumber: blockNumber,
      event: event,
      amount: web3.utils.fromWei(amount),
      from: from.toLowerCase(),
      fromBalance: web3.utils.fromWei(fromBalance),
      to: to.toLowerCase(),
      toBalance: web3.utils.fromWei(toBalance),
    });
  } catch (e) {
    console.log(e);
  }
}

// event Buy( address indexed user, uint256 stakeAmount, uint256[] codes, uint256[] amounts );
function buy(log) {
  const obj = log.returnValues;
  const user = db.getUser(obj.user);
  const tUser = updateUserBalance(true, obj.stakeAmount, user, obj.user);
  const cUser = updateContractBalance(true, obj.stakeAmount);
  saveEvent(log.transactionHash, log.blockNumber, "Buy", obj.stakeAmount, 
    obj.user, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

// event Redeem(address indexed user, bool indexed success, uint256[] codes, uint256 amount);
function redeem(log) {
  const obj = log.returnValues;
  const user = db.getUser(obj.user);
  if (obj.success) {
    const tUser = updateUserBalance(false, obj.amount, user, obj.user);
    const cUser = updateContractBalance(false, obj.amount);
    saveEvent(log.transactionHash, log.blockNumber, "Redeem", obj.amount, 
      obj.user, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
  }
}

// event GasNotEnough();
function gasNotEnough(log) {
  // console.log(JSON.stringify(log.returnValues));
}

// event PrizeWithdraw(address indexed user, bool indexed success, uint256 amount);
function prizeWithdraw(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.user);
  if (obj.success) {
    const tUser = updateUserBalance(false, obj.amount, user, obj.user);
    const cUser = updateContractBalance(false, obj.amount);
    saveEvent(log.transactionHash, log.blockNumber, "PrizeWithdraw", obj.amount, 
      obj.user, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
  }
}

// event UpdateSuccess();
async function updateSuccess(log) {
  // console.log(JSON.stringify(log.returnValues));
  // TODO: check "prizePool + delegatePool + demandDepositPool  =   balance" in db, but can't get delta amount of pools
}

// event SubsidyRefund(address indexed refundAddress, uint256 amount);
function subsidyRefund(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.refundAddress);
  const tUser = updateUserBalance(false, obj.amount, user, obj.refundAddress);
  const cUser = updateContractBalance(false, obj.amount);
  saveEvent(log.transactionHash, log.blockNumber, "SubsidyRefund", obj.amount, 
    obj.refundAddress, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

// event RandomGenerate(uint256 indexed epochID, uint256 random);
function randomGenerate(log) {
  // console.log(JSON.stringify(log.returnValues));
}

// event LotteryResult(uint256 indexed epochID, uint256 winnerCode, uint256 prizePool, address[] winners, uint256[] amounts);
function lotteryResult(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  for(let i = 0; i < obj.winners.length; i++) {
    if (web3.utils.toBN(obj.amounts[i]).toNumber() !== 0) {
      const user = db.getUser(obj.winners[i]);
      updateUserBalance(true, obj.amounts[i], user, user.address);
      saveEvent(log.transactionHash, log.blockNumber, "LotteryResult", obj.amounts[i], 
        obj.winners[i], obj.amounts[i], "", "");
    }
  }
}

// event FeeSend(address indexed owner, uint256 indexed amount);
function feeSend(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.owner);
  const tUser = updateUserBalance(true, obj.amount, user, obj.owner);
  const cUser = updateContractBalance(false, obj.amount);
  saveEvent(log.transactionHash, log.blockNumber, "FeeSend", obj.amount, 
    obj.owner, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

// event DelegateOut(address indexed validator, uint256 amount);
function delegateOut(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.validator);
  const tUser = updateUserBalance(false, obj.amount, user, obj.validator);
  const cUser = updateContractBalance(true, obj.amount);
  saveEvent(log.transactionHash, log.blockNumber, "DelegateOut", obj.amount, 
    obj.validator, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

// event delegateIn(address indexed sender, address indexed posAddress, uint indexed v)
// event DelegateIn(address indexed validator, uint256 amount);
function delegateIn(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.validator);
  const tUser = updateUserBalance(true, obj.amount, user, obj.validator);
  const cUser = updateContractBalance(false, obj.amount);
  saveEvent(log.transactionHash, log.blockNumber, "DelegateIn", obj.amount, 
    obj.validator, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

// event SubsidyIn(address indexed sender, uint256 amount);
function subsidyIn(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.sender);
  const tUser = updateUserBalance(true, obj.amount, user, obj.sender);
  const cUser = updateContractBalance(true, obj.amount);
  saveEvent(log.transactionHash, log.blockNumber, "SubsidyIn", obj.amount, 
    obj.sender, tUser.balance, process.env.JACKPOT_ADDRESS, cUser.balance);
}

function ownershipTransferred(log) {
  // console.log(JSON.stringify(log.returnValues));
}

function upgraded(log) {
  // console.log(JSON.stringify(log.returnValues));
}
function posDelegateOut(log) {
  // console.log(JSON.stringify(log.returnValues));
}
function posDelegateIn(log) {
  // console.log(JSON.stringify(log.returnValues));
}

const handlers = {};

handlers[buyEvent] = buy;
handlers[redeemEvent] = redeem;
handlers[gasNotEnoughEvent] = gasNotEnough;
handlers[prizeWithdrawEvent] = prizeWithdraw;
handlers[updateSuccessEvent] = updateSuccess;
handlers[subsidyRefundEvent] = subsidyRefund;
handlers[randomGenerateEvent] = randomGenerate;
handlers[lotteryResultEvent] = lotteryResult;
handlers[feeSendEvent] = feeSend;
handlers[delegateOutEvent] = delegateOut;
handlers[delegateInEvent] = delegateIn;
handlers[subsidyInEvent] = subsidyIn;
handlers[ownershipTransferredEvent] = ownershipTransferred;
handlers[upgradedEvent] = upgraded;
handlers[posDelegateOutEvent] = posDelegateOut;
handlers[posDelegateInEvent] = posDelegateIn;

// scan between [from, to]
async function scanTx(from, to) {
  const receipts = await wanChain.getTxsBetween(process.env.JACKPOT_ADDRESS, from, to);
  return receipts;
}

function parseReceipt(receipts, next) {
  const failedTxs = [];
  const successTxs = [];
  receipts.forEach((receipt) => {
    db.insertReceipt(receipt);
    if (receipt.status) {
      successTxs.push(receipt);

      const logs = receipt.logs;
      logs.forEach(log => {
        if (log.topics.length > 0) {
          try {
            if (!jackPot.contract.events[log.topics[0]]) {
              // pos events
              handlers[log.topics[0]](log);
            } else {
              // jackpot events
              const event = jackPot.contract.events[log.topics[0]]();
              const logObj = event._formatOutput(log);
              handlers[log.raw.topics[0]](logObj);
            }
          } catch (e) {
            jackPot.logAndSendCheckMail("user balance wrong", `err = ${e}, receipt=${JSON.stringify(receipt, null, 2)}`);
          } 
        }
      });
    } else {
      failedTxs.push(receipt);
    }
  })

  db.updateScan({blockNumber: parseInt(next)});

  return failedTxs;
}

let bScanning = false;
let lastException = null;
async function doScan(from, step, to, balance) {
  let next = from + step;
  if (next > to) {
    next = to;
  }
  log.info(`begin scan from=${from}, to=${next}`);

  const receipts = await scanTx(from, next);
  const transaction = db.db.transaction(parseReceipt);
  const failedTxs = transaction(receipts, next);

  if (failedTxs.length > 0) {
    await jackPot.logAndSendCheckMail("find wrong txs", JSON.stringify(failedTxs, null, 2));
  }

  if (next < to) {
    setTimeout( async () => {
      await doScan(next + 1, step, to, balance); 
    }, 0);
  } else {
    // check contract address balance === db.balance
    const jackPotBalance = web3.utils.toBN(balance);
    const dbBalance = web3.utils.toBN(db.getUser(process.env.JACKPOT_ADDRESS).balance);
    if (jackPotBalance.cmp(dbBalance) < 0) {
      await jackPot.logAndSendCheckMail("jackPotBalance error", `to=${to}, contract balance = ${web3.utils.fromWei(jackPotBalance)}, db balance = ${web3.utils.fromWei(dbBalance)}`);
    }
    lastException = null;
    bScanning = false;
  }
}

async function getBalanceAndBlockNumber() {
  let blockNumber = await wanChain.getBlockNumber();
  let balance = await wanChain.getBalance(process.env.JACKPOT_ADDRESS);
  while (true) {
    const blockNumberNew = await wanChain.getBlockNumber();
    if (blockNumber === blockNumberNew) {
      return {blockNumber: blockNumber, balance: balance}
    } else {
      blockNumber = blockNumberNew;
      balance = await wanChain.getBalance(process.env.JACKPOT_ADDRESS);
    }
  }
}

// if blockNumber's blockHash != scanned blockHash then rollback to the last same blockHash
async function scanAndCheck() {
  const from = db.getScan().blockNumber + 1;
  const step = parseInt(process.env.SCAN_STEP)
  const {blockNumber, balance} = await getBalanceAndBlockNumber();
  const to = blockNumber;
  if (from > to) {
    bScanning = false;
    return;
  }
  // const to = 54719;

  log.info(`scanAndCheck from=${from},to=${to}`);
  await doScan(from, step, to, balance);
}

function init() {
  db.init();
}

const startTime = new Date();
setTimeout(async () => {
  await jackPot.logAndSendCheckMail("mainnet Jack's Pot Checker start", `Checker start at local = ${startTime.toLocaleString()}, utc = ${startTime.toUTCString()}` );
}, 0);

init();

setInterval(() => {
  if (!bScanning) {
    bScanning = true;
    setTimeout(async () => {
      try {
        await scanAndCheck();
      } catch (e) {
        let reason = "";
        if (typeof(e) === "string") {
          reason = e;
        } else {
          reason = JSON.stringify(e);
        }
        if (lastException !== reason) {
          lastException = reason;
          await jackPot.logAndSendCheckMail("scanAndCheck exception", lastException);
        }
        bScanning = false;
      }
    }, 0);
  } else {
    log.info(`scanning = ${bScanning}`);
  }
}, parseInt(process.env.CHECK_INTERVAL));

process.on('unhandledRejection', (err) => {
  jackPot.logAndSendCheckMail('unhandled exception', `${err}`);
  bScanning = false;
});