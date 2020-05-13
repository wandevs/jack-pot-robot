// const schedule = require('node-schedule');
//
// const  scheduleCronstyle = ()=>{
//   //每分钟的第30秒定时执行一次:
//     schedule.scheduleJob('30 * * * * *',()=>{
//         console.log('scheduleCronstyle:' + new Date());
//     });
// }
//
// scheduleCronstyle();

// * * * * * *
// ┬ ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │ |
// │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
// │ │ │ │ └───── month (1 - 12)
// │ │ │ └────────── day of month (1 - 31)
// │ │ └─────────────── hour (0 - 23)
// │ └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
// require("dotenv").config({path: `${__dirname}/../.env.testnet`});
const log = require('./lib/log');
require('./lib/email');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const abiJackPot = require('../abis/JacksPot');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

log.info("test");

function parseOneLog(log) {
  const tmp = jackPot.parseEventLotteryLog(log);
  console.log(JSON.stringify(tmp));
  return tmp;
}

function parseLotteryResult(_logs) {
  let logs = _logs;
  if (!logs)
  logs = [{
    "address": "0x5DE7cb4C05aAeeDbAD8C1C536e4A1e82c9F61E7A",
    "topics": ["0xd5610194069263ad05a235464e87dbb01883927cb85d14217be94e54e2458511", "0x000000000000000000000000000000000000000000000000000000000065068c"],
    "data": "0x274ce113e31a4cdcb46fddf4b0c732eda2589a9f5023d6ac19bbca22dc182d53",
    "blockNumber": 145173,
    "transactionHash": "0x063a058ba9d0a7cd30b14f4049b4a778fa910e5905659c47c9741c17abe57d83",
    "transactionIndex": 0,
    "blockHash": "0x2e3952dbdc66d9248facfb135d9c67cdcee3fc2f66f1a6e61fcde0c58361bc63",
    "logIndex": 0,
    "removed": false,
    "id": "log_0cae8aa5"
  }, {
    "address": "0x5DE7cb4C05aAeeDbAD8C1C536e4A1e82c9F61E7A",
    "topics": ["0x7d15b902c9eb1ca6750ef6c45ce33fbff1d99b2c1c3f5de8229a2bacd27aa184", "0x000000000000000000000000000000000000000000000000000000000065068c"],
    "data": "0x00000000000000000000000000000000000000000000000000000000000019c30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000",
    "blockNumber": 145173,
    "transactionHash": "0x063a058ba9d0a7cd30b14f4049b4a778fa910e5905659c47c9741c17abe57d83",
    "transactionIndex": 0,
    "blockHash": "0x2e3952dbdc66d9248facfb135d9c67cdcee3fc2f66f1a6e61fcde0c58361bc63",
    "logIndex": 1,
    "removed": false,
    "id": "log_2a23a41e"
  }];

  // jackPot.parseEventLotteryLog(logs[1]);

  if (logs.length > 0) {
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if ( log.topics[0] === "0x7d15b902c9eb1ca6750ef6c45ce33fbff1d99b2c1c3f5de8229a2bacd27aa184") {
        const epochId = parseInt(log.topics[1], 16);
      //   event LotteryResult(
      //     uint256 indexed epochID,
      //     uint256 winnerCode,
      //     uint256 prizePool,
      //     address[] winners,
      //     uint256[] amounts
      // );
        //"0x
        // 00000000000000000000000000000000000000000000000000000000000019c3  winnerCode 0-19
        // 0000000000000000000000000000000000000000000000000000000000000000  prizePool  20-39
        // 0000000000000000000000000000000000000000000000000000000000000080  winners start 40-59
        // 00000000000000000000000000000000000000000000000000000000000000c0  amounts start 60-79
        // 0000000000000000000000000000000000000000000000000000000000000001  80 length 1
        // 0000000000000000000000000000000000000000000000000000000000000000  a0 value
        // 0000000000000000000000000000000000000000000000000000000000000001  c0 length 1
        // 0000000000000000000000000000000000000000000000000000000000000000",f0 value
        const event = {};
        event.winners = [];
        event.amounts = [];
        const wincode = parseInt(log.data.substr(0, 66), 16);
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
        event.wincode = wincode;
        event.prizePool = prizePool.toString(10);
        console.log(`epochId = ${epochId}, wincode = ${wincode}, prizePool = ${prizePool.toString(10)}`);
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
  const randomGenerateTime = (nextEpochStartTime - curEpochStartTime) * 10/12 + curEpochStartTime;
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
  if (ev.wincode !== winCode) {
    log.error(`winner code error ev.wincode = ${ev.wincode}, randomLast = ${winCode}`)
  }
}

async function testCore() {
  await jackPot.open();
  // await jackPot.buy([1], [1000]);
  // await jackPot.update();
  // await jackPot.chooseValidator();
  // await jackPot.runDelegateIn();
  // const amount = web3.utils.toBN(await jackPot.getPendingAmount());
  // if (amount > 0) {
  //   await jackPot.subsidyIn(amount.add(web3.utils.toWei(web3.utils.toBN(1000))));
  // }
  // await testLottery();
  // await jackPot.open();
  // await jackPot.redeem([1]);
}

// setTimeout( async () => {
//   await testCore();
//   // setTimeout( async () => {
//   //   await testCore();
//   //   setTimeout( async () => {
//   //     await testCore();
//   //   }, 0);
//   // }, 0);
//   wanChain.closeEngine();
// }, 0);

const outOfGasEvent = web3.utils.keccak256("GasNotEnough()");
const subsidyRefundEvent = web3.utils.keccak256("SubsidyRefund(address,uint256)");
const updateSuccessEvent = web3.utils.keccak256("UpdateSuccess()");
setTimeout( async () => {
  // console.log(`balance = ${await wanChain.getBalance(process.env.JACKPOT_OPERATOR_ADDRESS)}`);
  // console.log(`nonce = ${await wanChain.getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS)}`);
  const p = await wanChain.getScFun("getPendingAmount", [], jackPot.contract, abiJackPot);
  // // console.log(`blockNumber =${await wanChain.getBlockNumber()}`);
  // // console.log(`stake Info =${JSON.stringify(await wanChain.getStakerInfo(await wanChain.getBlockNumber()))}`);
  // // console.log(`getTransactionReceipt  = ${JSON.stringify(await wanChain.getTransactionReceipt("0xac729228dc13ec59e84d51936a615ea7ab85bbe9489db0268af594d0c3ecba4c"))}`);
  //
  // // test get method
  // console.log(`getPendingAmount = ${p}`);
  // console.log(`operator = ${await wanChain.getScVar("operator", jackPot.contract, abiJackPot)}`);
  // console.log(`validatorsInfo = ${JSON.stringify(await wanChain.getScVar("validatorsInfo", jackPot.contract, abiJackPot))}`);
  // console.log(`closed = ${await wanChain.getScVar("closed", jackPot.contract, abiJackPot)}`);
  // console.log(`poolInfo = ${JSON.stringify(await wanChain.getScVar("poolInfo", jackPot.contract, abiJackPot))}`);


  // const success = await jackPot.balanceCheck();
  // console.log(success);
  //
  // await jackPot.getValidatorsInfo();

  await jackPot.update();
  await wanChain.closeEngine();
}, 0);


// process.on('unhandledRejection', (err) => {
//   console.log(err);
// });

