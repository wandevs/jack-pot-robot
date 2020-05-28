const schedule = require('node-schedule');
const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

async function doSchedule(name, tryTimes = process.env.JACKPOT_OPERATOR_RETRY_TIMES, isSend = true) {
  log.info(`${name} begin`);
  let leftTime = parseInt(tryTimes);

  while (leftTime > 0) {
    try {
      leftTime --;
      return await jackPot[name]();
    } catch (e) {
      if (tryTimes === 0) {
        await jackPot.logAndSendMail(`${name} exception`, e, isSend);
        return;
      }
      log.error(`${name} exception : ${e}` );
      await sleep(parseInt(process.env.JACKPOT_OPERATOR_RETRY_INTERVAL) * 1000);
    }
  }
}

const robotSchedules = ()=>{
  // update: The settlement robot calls this function daily to update the capital pool and settle the pending refund.
  schedule.scheduleJob('30 */5 * * * *', async () => {
    await doSchedule('update', "3",false);
  });

  // open: open betting every saturday morning
  schedule.scheduleJob('0 0 8 * * *', async () => {
    await doSchedule('open');
  });

  // close: is called regularly by the robot on 4 nights a week to close bets.
  schedule.scheduleJob('0 0 6 * * *', async () => {
    await doSchedule('close');
  });

  // runDelegateIn: After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
  schedule.scheduleJob('0 */10 * * * *', async () => {
    // check delegate total amount, when > 20000 wan, change validator, if use validators > 5, delegateOut one
    const {isSetValidator, isDelegateOut} = await doSchedule('chooseValidator');

    if (isSetValidator) {
      log.info('runDelegateIn current lottery');
      await doSchedule('runDelegateIn');
    } else if (!isDelegateOut) {
      await jackPot.logAndSendMail("chooseValidator failed", "please add more validator");
    }
  });

  // Lottery settlement:  On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
  schedule.scheduleJob('0 0 7 * * *', async () => {
    await doSchedule('lotterySettlement');
  });

  // check contract address's balance >= positive pool's balance per minute
  schedule.scheduleJob('30 * * * * *', async () => {
    try {
      log.debug('check balance');
      if(! await jackPot.isClose()) {
        if(! await jackPot.balanceCheck()) {
          await jackPot.logAndSendMail("wrong balance", "demandDepositPool > contract's balance");
          await jackPot.close();
        }
      }
    } catch (e) {
      // await jackPot.logAndSendMail("contract address balance check exception", e);
      log.warn("check balance exception " + e)
    }
  });

  // daily check if a validator want to exit, send a email, and delegateOut
  schedule.scheduleJob('0 40 * * * *', async () => {
    await doSchedule('checkStakerOut');
  });

};

const startTime = new Date();
setTimeout(async () => {
  await jackPot.logAndSendMail("testnet Jack's Pot robot start", `robot start at local = ${startTime.toLocaleString()}, utc = ${startTime.toUTCString()}` );
}, 0);

robotSchedules();
