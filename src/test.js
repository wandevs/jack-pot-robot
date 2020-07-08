const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const abiJackPot = require('../abi/jacks-pot');
const keys = require('../keys/key-pairs.json');
const crypto = require('crypto');
const util = require('ethereumjs-util');

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
  const randomGenerateTime = (nextEpochStartTime - curEpochStartTime) * 10/12 + curEpochStartTime + 5;
  let now = new Date().getTime() / 1000;
  const waitTime = now > randomGenerateTime ? 0 : randomGenerateTime - now;

  if (waitTime > 50) {
    setTimeout(async () => {
      await customerBuyAndRedeem();
    }, 20000);
  }

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
async function customerBuyAndRedeem(noRedeem = false) {
  for (let j = 0; j < keys.length; j++) {
    if (util.bufferToInt(crypto.randomBytes(6)) % 6 == 5) {
      const userInfo = await jackPot.getUserCodeList(keys[j].address);
      console.log(`address = ${keys[j].address}`);
      console.log(JSON.stringify(userInfo));

      // buy or redeem
      let isBuy = true;
      const random = util.bufferToInt(crypto.randomBytes(6));
      let codeCount = util.bufferToInt(crypto.randomBytes(6)) % 50 + 1;
      if (userInfo.exits.length == 50) {
        isBuy = false;
      } else if (userInfo.exits.length == 0) {
        isBuy = true;
      } else {
        isBuy = random % 2 == 0;
        if (isBuy) {
          codeCount = (50 - userInfo.exits.length) > codeCount ? codeCount : (50 - userInfo.exits.length);
        } else {
          codeCount = userInfo.exits.length > codeCount ? codeCount : userInfo.exits.length;
        }
      }
      log.info(`try buy = ${isBuy}, doCount = ${codeCount}, oldCount = ${userInfo.exits.length}, from = ${keys[j].address}, `);

      try {
        if (isBuy) {
          const codes = [], amounts = [];
          for (let i = 0; i < codeCount; i++) {
            const code = util.bufferToInt(crypto.randomBytes(6)) % 10000;
            const amount = (util.bufferToInt(crypto.randomBytes(6)) % 3 + 1) * 10;
            codes.push(code);
            amounts.push(amount);
          }
          log.info(`code = ${JSON.stringify(codes)}`);
          await jackPot.buy(codes, amounts, keys[j].privateKey, keys[j].address);
        } else {
          if (!noRedeem) {
            const codes = [];
            for (let i = 0; i < codeCount; i++) {
              codes.push(parseInt(userInfo.codes[i], 10));
            }
            await jackPot.redeem(codes, keys[j].privateKey, keys[j].address);
          }
        }
      } catch (e) {
        log.warn(e);
        return;
      }
    }
  }
}

async function customerClean() {
  for (let j = 0; j < keys.length; j++) {
    const userInfo = await jackPot.getUserCodeList(keys[j].address);
    if (userInfo && userInfo.exits.length > 0) {
      try {
        const codes = [];
        for (let i = 0; i < userInfo.codes.length; i++) {
          codes.push(parseInt(userInfo.codes[i], 10));
        }
        await jackPot.redeem(codes, keys[j].privateKey, keys[j].address);
      } catch (e) {
        log.warn(e);
        return;
      }
    }
  }
}

// const outOfGasEvent = web3.utils.keccak256("GasNotEnough()");
async function testCore() {
  // // const random = util.bufferToInt(crypto.randomBytes(6));
  // // if (random % 3 === 0) {
  //   await customerClean();
  // // }
  // await jackPot.open();
  // await customerBuyAndRedeem(true);
  // await jackPot.update();
  // const {isSetValidator, isDelegateOut} = await jackPot.chooseValidator();
  // if (isSetValidator) {
  //   await jackPot.runDelegateIn();
  // }
  // // const amount = web3.utils.toBN(await jackPot.getPendingAmount());
  // // if (amount > 0) {
  // //   await jackPot.subsidyIn(amount.add(web3.utils.toWei(web3.utils.toBN(1000))));
  // //   await tryDelegateOut();
  // // }
  // await testLottery();
  // await jackPot.open();

  // setTimeout( async () => {
  //   await testCore();
  // }, 10000);
  const {isSetValidator, isDelegateOut} = await jackPot.chooseValidator();
}

setTimeout( async () => {
  await testCore();
}, 0);

