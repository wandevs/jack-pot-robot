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

const log = require('./lib/log');
require('./lib/email');
const jackPot = require('./lib/wanchain').jackPot;
const pos = require('./lib/wanchain').pos;
const getBalance = require('./lib/wanchain').getBalance;
const loadValidatorsState = require('./lib/wanchain').loadValidatorsState;
const saveValidatorsState = require('./lib/wanchain').saveValidatorsState;
const sendMail = require('./lib/email');

log.info("test");



setTimeout( async () => {
  // log.info(await getBalance(process.env.JACKPOT_OPERATOR_ADDRESS));

  // await jackPot.open();
  // await jackPot.update();
  // await jackPot.lotterySettlement();
  // await jackPot.close();
  // await jackPot.runDelegateIn();

  // await jackPot.balanceCheck();

  // await sendMail("HelloWorld", "this is an error");

  // await pos.getStakerInfo(73665);

  // const dataOrigin = {
  //   "0x23fc2eda99667fd3df3caa7ce7e798d94eec06eb": 1,
  //   "0x435b316a70cdb8143d56b3967aacdb6392fd6125": 0,
  //   "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e": 1};
  // saveValidatorsState(dataOrigin);
  // const data = loadValidatorsState();
  // console.log(JSON.stringify(data));

  // await jackPot.getValidatorsInfo();

  await jackPot.checkStakerOut();

}, 0);

