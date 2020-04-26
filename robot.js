const schedule = require('node-schedule');
// const iWan = require('./lib/iwan');
const wan = require('./wanchain');
const log4js = require('log4js');
log4js.configure('./config/log4js.json');
const log = log4js.getLogger("app");

const robotSchedules = ()=>{
  // update，daily
  schedule.scheduleJob('0 6 * * * *', async () => {
    log.info('open a new lottery');
    await wan.jackPot.update();
  }); 

  // open 开始投注，周六早上8点 
  schedule.scheduleJob('0 8 * * * 6', async () => {
    log.info('open a new lottery');
    await wan.jackPot.open();
  }); 

  // close 关闭投注，周五早上7点
  schedule.scheduleJob('0 7 * * * 5', async () => {
    log.info('close current lottery');
    await wan.jackPot.close();
  });

  // runDelegateIn, 周五晚上8点
  schedule.scheduleJob('0 20 * * * 5', async () => {
    log.info('runDelegateIn current lottery');
    await wan.jackPot.runDelegateIn();
  });

  // lotterySettlement 结算, 周五晚上7点
  schedule.scheduleJob('0 19 * * * 5', async () => {
    log.info('settlement current lottery');
    await wan.jackPot.lotterySettlement();
  });
};

log.info('running robot');
robotSchedules();