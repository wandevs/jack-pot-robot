const schedule = require('node-schedule');
const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const sendMail = require('./lib/email');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

async function logAndSendMail(subject, content) {
  log.error(subject + " : " + content);
  try {
    await sendMail(subject, content);
  } catch (e) {
    log.error(`send mail failed, sub = ${subject}, content = ${content}`);
  }
}

async function doSchedule(name, f, tryTimes = process.env.JACKPOT_OPERATOR_RETRY_TIMES) {
  log.info(`${name} begin`);
  let leftTime = tryTimes;

  while (leftTime > 0) {
    try {
      leftTime --;
      return await f();
    } catch (e) {
      if (tryTimes === 0) {
        await logAndSendMail(`${name} exception`, e);
        return;
      }
      log.error(`${name} exception : ` + " : ${e}" );
      await sleep(process.env.JACKPOT_OPERATOR_RETRY_INTERVAL);
    }
  }
}

const robotSchedules = ()=>{
  // update: The settlement robot calls this function daily to update the capital pool and settle the pending refund.
  schedule.scheduleJob('30 */11 * * * *', async () => {
    await doSchedule('update', jackPot.update);
  });

  // open: open betting every saturday morning
  schedule.scheduleJob('0 0 8 * * *', async () => {
    await doSchedule('open', jackPot.open);
  });

  // close: is called regularly by the robot on 4 nights a week to close bets.
  schedule.scheduleJob('0 0 6 * * *', async () => {
    await doSchedule('close', jackPot.close);
  });

  // runDelegateIn: After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
  schedule.scheduleJob('0 20 * * * *', async () => {
    // check delegate total amount, when > 20000 wan, change validator, if use validators > 5, delegateOut one
    const success = await doSchedule('chooseValidator', jackPot.chooseValidator);

    if (success) {
      log.info('runDelegateIn current lottery');
      await doSchedule('runDelegateIn', jackPot.runDelegateIn);
    } else {
      await logAndSendMail("chooseValidator failed", "please add more validator");
    }
  });

  // Lottery settlement:  On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
  schedule.scheduleJob('0 0 7 * * *', async () => {
    await doSchedule('lotterySettlement', jackPot.lotterySettlement);
  });

  // check contract address's balance >= positive pool's balance per minute
  schedule.scheduleJob('30 * * * * *', async () => {
    try {
      if(! await jackPot.isClose()) {
        if(! await jackPot.balanceCheck()) {
          await sendMail("wrong balance", "demandDepositPool > contract's balance");
          await close();
        }
      }
    } catch (e) {
      await sendMail("contract address balance check exception", e);
    }
  });

  // daily check if a validator want to exit, send a email, and delegateOut
  schedule.scheduleJob('0 40 * * * *', async () => {
    await doSchedule('checkStakerOut', jackPot.checkStakerOut);
  });

};

log.info('robot start');
const startTime = new Date();
setTimeout(async () => {
  await sendMail("testnet Jack's Pot robot start", `robot start at local = ${startTime.toLocaleString()}, utc = ${startTime.toUTCString()}` );
}, 0);

robotSchedules();
