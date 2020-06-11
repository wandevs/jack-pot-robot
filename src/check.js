const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const web3_ws = require(`./lib/${process.env.CHAIN_ENGINE}`).web3_ws;
const path = require('path');
const fs = require('fs');
const db = require('./lib/sqlite_db');
const { sleep } = require('./lib/utils');

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
      db.insertUser({address: userAddress.toLowerCase(), balance: amount});
    } else {
      throw `user: ${userAddress} balance not enough`;
    }
  }
}

function updateContractBalance(bAdd, amount) {
  const contractUser = db.getUser(process.env.JACKPOT_ADDRESS);
  updateUserBalance(bAdd, amount, contractUser, process.env.JACKPOT_ADDRESS);
}

// event Buy( address indexed user, uint256 stakeAmount, uint256[] codes, uint256[] amounts );
function buy(log) {
  const obj = log.returnValues;
  const user = db.getUser(obj.user);
  updateUserBalance(true, obj.stakeAmount, user, obj.user);
  updateContractBalance(true, obj.stakeAmount);
}

// event Redeem(address indexed user, bool indexed success, uint256[] codes, uint256 amount);
function redeem(log) {
  const obj = log.returnValues;
  const user = db.getUser(obj.user);
  if (obj.success) {
    updateUserBalance(false, obj.amount, user, obj.user);
    updateContractBalance(false, obj.amount);
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
    updateUserBalance(false, obj.amount, user, obj.user);
    updateContractBalance(false, obj.amount);
  }
}

// event UpdateSuccess();
function updateSuccess(log) {
  // console.log(JSON.stringify(log.returnValues));
  // TODO: check "prizePool + delegatePool + demandDepositPool  =   balance" in db, but can't get delta amount of pools
}

// event SubsidyRefund(address indexed refundAddress, uint256 amount);
function subsidyRefund(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.refundAddress);
  updateUserBalance(false, obj.amount, user, obj.refundAddress);
  updateContractBalance(false, obj.amount);
}

// event RandomGenerate(uint256 indexed epochID, uint256 random);
function randomGenerate(log) {
  // console.log(JSON.stringify(log.returnValues));
}

// event LotteryResult(uint256 indexed epochID, uint256 winnerCode, uint256 prizePool, address[] winners, uint256[] amounts);
function lotteryResult(log) {
  // console.log(JSON.stringify(log.returnValues));
}

// event FeeSend(address indexed owner, uint256 indexed amount);
function feeSend(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.owner);
  updateUserBalance(true, obj.amount, user, obj.owner);
  updateContractBalance(false, obj.amount);

}

// event DelegateOut(address indexed validator, uint256 amount);
function delegateOut(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.validator);
  updateUserBalance(false, obj.amount, user, obj.validator);
  updateContractBalance(true, obj.amount);
}

// event delegateIn(address indexed sender, address indexed posAddress, uint indexed v)
// event DelegateIn(address indexed validator, uint256 amount);
function delegateIn(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.validator);
  updateUserBalance(true, obj.amount, user, obj.validator);
  updateContractBalance(false, obj.amount);
}

// event SubsidyIn(address indexed sender, uint256 amount);
function subsidyIn(log) {
  // console.log(JSON.stringify(log.returnValues));
  const obj = log.returnValues;
  const user = db.getUser(obj.sender);
  updateUserBalance(true, obj.amount, user, obj.sender);
  updateContractBalance(true, obj.amount);
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

// for (it in handlers) {
//   console.log("it = " + it);
// }
// `
// it = 0xf92806ed4b288c6cb9d35fccadbc6023b411ff69030ae055ecf9785b18165324
// it = 0x02768cf47bd502ac2b9739723150cb77b0a98950fd067287c0a65d912149a9cb
// it = 0x71238424bca4bc92d1155a651ad499bf349a54a66afd80751c17cab24c3cf895
// it = 0x8a234cda743a9f7572dc9b0b6fb2ffebf42374bb768164a04c446483579abc65
// it = 0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16
// it = 0xf6a1f17846607f903615c8feba44ef2affda4abfe37aed75d2ada327cfd2bdb2
// it = 0xd5610194069263ad05a235464e87dbb01883927cb85d14217be94e54e2458511
// it = 0x7d15b902c9eb1ca6750ef6c45ce33fbff1d99b2c1c3f5de8229a2bacd27aa184
// it = 0x30d7c727010bd07760adc4a97df25f841b278de6b8ce98061eae479bf21273f8
// it = 0xa38c0de852a2fafa244b1ae0dd0a953a4c002d7b54cde932d9965d9b2d390e2d
// it = 0x4e3aa93ab6e2e42feec798732c048a9d1e2fd6dbde19547e3ed903b3b0fea17e
// it = 0xff1173e2426cd768da9dd8d89f7c1d32edd76f900de72ac722cd759f5a6c5185
// it = 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0
// it = 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b
// it = 0xc56651e869741bd9650fdd984421326186e27584c2db5f5c08925631f320a39d
// it = 0x415d10a111ef0522e5fedeec53cfc4eece3854ba6e1efdf147d5c5f6e624c1a2
// `

// web3--1.20, new interface,   gwan need open --ws --wsport 8546 --wsorigins "*"
// async function eventFilter() {
//   const options = {
//     fromBlock: 27000, 
//     toBlock: 'latest', 
//     address: process.env.JACKPOT_ADDRESS, 
//     // topics: [buyEvent, "0x0000000000000000000000004db93be4e7e1bd5065ef49bf893e79301d9ee476"]
//   }
// 
//   const subscription = web3_ws.eth.subscribe('logs', options, (error, result) => {
//     if (error) {
//       console.log("error:" + error);
//     } else {
//       console.log(JSON.stringify(result));
//     }
//   })
//   .on("data", function(log){
//     console.log("data:" + JSON.stringify(log));
//   })
//   .on("changed", function(log){
//     console.log("changed:" + log);
//   });
// }

// web3--1.20, new interface
// async function getPastEvents() {
//   const options = {
//     fromBlock: 279773, 
//     toBlock: 279773, 
//     address: process.env.JACKPOT_ADDRESS, 
//   }
//
//   jackPot.contract
//   const subscription = jackPot.contract.getPastEvents('allEvents', options, (error, results) => {
//     if (error) {
//       console.log("error:" + error);
//     } else {
//       console.log(JSON.stringify(result, null, 2));
//       results.forEach(result => {
//         result.returnValues.amounts.forEach(amount => {
// 
//         })
//       })
//     }
//   })
// }

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
            jackPot.logAndSendMail("user balance wrong", `err = ${e}, receipt=${JSON.stringify(receipt, null, 2)}`);
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
async function doScan(from, step, to) {
  let next = from + step;
  if (next > to) {
    next = to;
  }

  const receipts = await scanTx(from, next);
  const transaction = db.db.transaction(parseReceipt);
  const failedTxs = transaction(receipts, next);

  if (failedTxs.length > 0) {
    await jackPot.logAndSendMail("find wrong txs", JSON.stringify(failedTxs, null, 2));
  }

  if (next < to) {
    setTimeout( async () => {
      await doScan(next + 1, step, to); 
    }, 0);
  } else {
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
  // const to = 54719;

  log.info(`scanAndCheck from=${from},to=${to}`);
  await doScan(from, step, to);
  // check contract address balance === db.balance
  const jackPotBalance = web3.utils.toBN(balance);
  const dbBalance = web3.utils.toBN(db.getUser(process.env.JACKPOT_ADDRESS).balance);
  if (jackPotBalance.cmp(dbBalance) < 0) {
    await jackPot.logAndSendMail("jackPotBalance error", `from=${from}, to=${to}, contract balance = ${web3.utils.fromWei(jackPotBalance)}, db balance = ${web3.utils.fromWei(dbBalance)}`);
  }
}

function init() {
  db.init();
}

init();

setInterval(() => {
  if (!bScanning) {
    bScanning = true;
    setTimeout(async () => {
      await scanAndCheck();
    }, 0);
  }
}, parseInt(process.env.CHECK_INTERVAL));

process.on('unhandledRejection', (err) => {
  jackPot.logAndSendMail('unhandled exception', `${err}`);
});