const schedule = require('node-schedule');
const log = require('./lib/log');
const jackPot = require('./lib/jackPot');
const sendMail = require('./lib/email');


const robotSchedules = ()=>{
  // update: The settlement robot calls this function daily to update the capital pool and settle the pending refund.
  schedule.scheduleJob('0 0 6 * * *', async () => {
    log.info('update a lottery');
    await jackPot.update();
  }); 

  // open: open betting every saturday morning
  schedule.scheduleJob('0 0 8 * * 6', async () => {
    log.info('open a new lottery');
    await jackPot.open();
  }); 

  // close: is called regularly by the robot on 4 nights a week to close bets.
  schedule.scheduleJob('0 0 7 * * 5', async () => {
    log.info('close current lottery');
    await jackPot.close();
  });

  // runDelegateIn: After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
  schedule.scheduleJob('0 0 20 * * *', async () => {
    // check delegate total amount, when > 20000 wan, change validator, if use validators > 5, delegateOut one
    const success = await jackPot.chooseValidator();
    log.info('runDelegateIn current lottery');
    if (success) {
      await jackPot.runDelegateIn();
    }
  });

  // Lottery settlement:  On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
  schedule.scheduleJob('0 0 19 * * 5', async () => {
    log.info('settlement current lottery');
    await jackPot.lotterySettlement();
  });

  // check contract address's balance >= positive pool's balance per minute
  schedule.scheduleJob('30 * * * * *', async () => {
    const isClose = await jackPot.isClose();
    if (isClose) {
      return;
    }
    const success = await jackPot.balanceCheck();
    if (!success) {
      // send a mail
      await sendMail("balance error", "demandDepositPool > contract's balance");
      // close contract
      await close();
    }
  });

  // daily check if a validator want to exit, send a email, and delegateOut
  schedule.scheduleJob('0 0 24 * * *', async () => {
    log.info('check validator exit');
    await jackPot.checkStakerOut();
  });

  //
};

log.info('running robot');
robotSchedules();