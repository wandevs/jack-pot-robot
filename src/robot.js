const schedule = require('node-schedule');
const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const sendMail = require('./lib/email');

async function logAndSendMail(subject, content) {
  log.error(subject + " : " + content);
  await sendMail(subject, content);
}

const robotSchedules = ()=>{
  // update: The settlement robot calls this function daily to update the capital pool and settle the pending refund.
  schedule.scheduleJob('0 0 5 * * *', async () => {
    log.info('update a lottery');
    try {
      await jackPot.update();
    } catch (e) {
      await logAndSendMail("update a lottery exception", e);
    }
  });

  // open: open betting every saturday morning
  schedule.scheduleJob('0 0 8 * * *', async () => {
    log.info('open a new lottery');
    try {
      await jackPot.open();
    } catch (e) {
      await logAndSendMail("open a new lottery exception", e);
    }
  });

  // close: is called regularly by the robot on 4 nights a week to close bets.
  schedule.scheduleJob('0 0 6 * * *', async () => {
    log.info('close current lottery');
    try {
      await jackPot.close();
    } catch (e) {
      await logAndSendMail("close current lottery exception", e);
    }
  });

  // runDelegateIn: After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
  schedule.scheduleJob('0 30 6 * * *', async () => {
    // check delegate total amount, when > 20000 wan, change validator, if use validators > 5, delegateOut one
    let success = true;
    try {
      log.info('chooseValidator');
      success = await jackPot.chooseValidator();
    } catch (e) {
      await logAndSendMail("chooseValidator exception", e)
    }

    if (success) {
      log.info('runDelegateIn current lottery');
      try {
        await jackPot.runDelegateIn();
      } catch (e) {
        await logAndSendMail("runDelegateIn exception", e);
      }
    } else {
      await logAndSendMail("chooseValidator failed", "please add more validator");
    }
  });

  // Lottery settlement:  On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
  schedule.scheduleJob('0 0 7 * * *', async () => {
    log.info('settlement current lottery');
    try {
      await jackPot.lotterySettlement();
    } catch (e) {
      await logAndSendMail("settlement exception", e)
    }
  });

  // check contract address's balance >= positive pool's balance per minute
  schedule.scheduleJob('30 * * * * *', async () => {
    try {
      const isClose = await jackPot.isClose();
      if (isClose) {
        return;
      }
      const success = await jackPot.balanceCheck();
      if (!success) {
        // send a mail
        await sendMail("wrong balance", "demandDepositPool > contract's balance");
        // close contract
        await close();
      }
    } catch (e) {
      await sendMail("contract address balance check exception", e);
    }
  });

  // daily check if a validator want to exit, send a email, and delegateOut
  schedule.scheduleJob('0 30 4 * * *', async () => {
    log.info('check validator exit');
    try {
      await jackPot.checkStakerOut();
    } catch (e) {
      await sendMail("check validator exit exception", e);
    }
  });

};

const startTime = new Date();
log.info('robot start');
setTimeout(async () => {
  await sendMail('robot start', `robot start at local = ${startTime.toLocaleString()}, utc = ${startTime.toUTCString()}` );
}, 0);

robotSchedules();
