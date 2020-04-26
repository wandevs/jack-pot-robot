const schedule = require('node-schedule');
// const iWan = require('./lib/iwan');
const wan = require('./wanchain');
const log4js = require('log4js');
log4js.configure('./config/log4js.json');
const log = log4js.getLogger("app");

const robotSchedules = ()=>{
  // update: The settlement robot calls this function daily to update the capital pool and settle the pending refund.
  schedule.scheduleJob('0 0 6 * * *', async () => {
    log.info('update a lottery');
    await wan.jackPot.update();
  }); 

  // open: open betting every saturday morning
  schedule.scheduleJob('0 0 8 * * 6', async () => {
    log.info('open a new lottery');
    await wan.jackPot.open();
  }); 

  // close: is called regularly by the robot on 4 nights a week to close bets.
  schedule.scheduleJob('0 0 7 * * 5', async () => {
    log.info('close current lottery');
    await wan.jackPot.close();
  });

  // runDelegateIn: After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
  schedule.scheduleJob('0 0 20 * * *', async () => {
    log.info('runDelegateIn current lottery');
    await wan.jackPot.runDelegateIn();
  });

  // Lottery settlement:  On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
  schedule.scheduleJob('0 0 19 * * 5', async () => {
    log.info('settlement current lottery');
    await wan.jackPot.lotterySettlement();
  });
};

log.info('running robot');
robotSchedules();