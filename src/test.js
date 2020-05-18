const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const abiJackPot = require('../abi/jacks-pot');
const keys = require('../keys/key-pairs.json');
const crypto = require('crypto');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

log.info("test");

function parseLotteryResult(logs) {
  if (logs.length > 0) {
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if ( log.topics[0] === "0x7d15b902c9eb1ca6750ef6c45ce33fbff1d99b2c1c3f5de8229a2bacd27aa184") {
        const epochId = parseInt(log.topics[1], 16);
      
        const event = {};
        event.winners = [];
        event.amounts = [];
        const winCode = parseInt(log.data.substr(0, 66), 16);
        const prizePool = web3.utils.toBN(log.data.substr(66, 64));
        const winnersStart = 2 * parseInt(log.data.substr(130, 64), 16);
        const winnerLength = parseInt(log.data.substr(2 + winnersStart, 64), 16);
        const amountStart = 2 * parseInt(log.data.substr(194, 64), 16);
        const amountLength = parseInt(log.data.substr(2 + amountStart, 64), 16);
        for (let i=0; i<winnerLength; i++) {
          event.winners.push('0x' + log.data.substr(2 + winnersStart + 64 + i * 64 + 24, 40));
          event.amounts.push(web3.utils.fromWei('0x' + log.data.substr(2 + amountStart + 64 + i * 64, 64)).toString(10));
        }
        event.epochID = epochId;
        event.winCode = winCode;
        event.prizePool = prizePool.toString(10);
        console.log(`epochId = ${epochId}, winCode = ${winCode}, prizePool = ${prizePool.toString(10)}`);
        return event;
      }
    }
  } else {
    log.error("lotterySettlement error");
  }
  return null;
}

async function testLottery() {
  const curEpochID = await wanChain.getEpochID();
  const curEpochStartTime = await wanChain.getTimeByEpochID(curEpochID);
  const nextEpochStartTime = await wanChain.getTimeByEpochID(curEpochID + 1);
  const randomGenerateTime = (nextEpochStartTime - curEpochStartTime) * 11/12 + curEpochStartTime;
  let now = new Date().getTime() / 1000;
  const waitTime = now > randomGenerateTime ? 0 : randomGenerateTime - now;

  await sleep(waitTime * 1000);

  await jackPot.close();
  const { logs }  = await jackPot.lotterySettlement();
  log.info(JSON.stringify(logs));

  now = new Date().getTime() / 1000;

  await sleep((now > nextEpochStartTime ? 5 : nextEpochStartTime - now + 5) * 1000);

  log.info("begin check win code");
  // check winner code
  const currentRandom = web3.utils.toBN(await wanChain.getRandom(curEpochID + 1, -1)).toString(10);
  log.info(`random = ${currentRandom}`);
  const ev = parseLotteryResult(logs);
  const winCode = parseInt(currentRandom.substr(currentRandom.length - 4));
  if (ev.winCode !== winCode) {
    log.error(`winner code error ev.winCode = ${ev.winCode}, randomLast = ${winCode}`)
  }
}

// select code and buy
async function customerBuy() {
  const randomBuf = crypto.getRandom(32);
}

async function testCore() {
  await jackPot.open();
  // await jackPot.buy([1], [20000]);
  await jackPot.update();
  await jackPot.chooseValidator();
  await jackPot.runDelegateIn();
  // const amount = web3.utils.toBN(await jackPot.getPendingAmount());
  // if (amount > 0) {
  //   await jackPot.subsidyIn(amount.add(web3.utils.toWei(web3.utils.toBN(1000))));
  // }
  await testLottery();
  await jackPot.open();
  // await jackPot.redeem([1]);

  setTimeout( async () => {
    await testCore();
  }, 0);
}

setTimeout( async () => {
  await testCore();
}, 0);

// const outOfGasEvent = web3.utils.keccak256("GasNotEnough()");
// const subsidyRefundEvent = web3.utils.keccak256("SubsidyRefund(address,uint256)");
// const updateSuccessEvent = web3.utils.keccak256("UpdateSuccess()");
// setTimeout( async () => {
//   // console.log(`balance = ${await wanChain.getBalance(process.env.JACKPOT_OPERATOR_ADDRESS)}`);
//   // console.log(`nonce = ${await wanChain.getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS)}`);
//   const p = await wanChain.getScFun("getPendingAmount", [], jackPot.contract, abiJackPot);
//   // console.log(`blockNumber =${await wanChain.getBlockNumber()}`);
//   // console.log(`stake Info =${JSON.stringify(await wanChain.getStakerInfo(await wanChain.getBlockNumber()))}`);
//   // console.log(`getTransactionReceipt  = ${JSON.stringify(await wanChain.getTransactionReceipt("0xac729228dc13ec59e84d51936a615ea7ab85bbe9489db0268af594d0c3ecba4c"))}`);
//
//   // test get method
//   console.log(`getPendingAmount = ${p}`);
//   console.log(`operator = ${await wanChain.getScVar("operator", jackPot.contract, abiJackPot)}`);
//   console.log(`validatorsInfo = ${JSON.stringify(await wanChain.getScVar("validatorsInfo", jackPot.contract, abiJackPot))}`);
//   console.log(`closed = ${await wanChain.getScVar("closed", jackPot.contract, abiJackPot)}`);
//   console.log(`poolInfo = ${JSON.stringify(await wanChain.getScVar("poolInfo", jackPot.contract, abiJackPot))}`);
//
//
//   const success = await jackPot.balanceCheck();
//   console.log(success);
//
//   await jackPot.getValidatorsInfo();
//
//   await jackPot.update();
//   await wanChain.closeEngine();
// }, 0);


// process.on('unhandledRejection', (err) => {
//   console.log(err);
// });

