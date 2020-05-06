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
const jackPot = require('./lib/jack-pot');
const pos = require('./lib/wanchain').pos;
const web3 = require('web3');
const sendMail = require('./lib/email');

log.info("test");



setTimeout( async () => {
  // log.info(await getBalance(process.env.JACKPOT_OPERATOR_ADDRESS));

  const a = await jackPot.isClose();
  await jackPot.open();
  await jackPot.buy([1], [1000]);
  await jackPot.update();
  await jackPot.chooseValidator();
  await jackPot.runDelegateIn();
  await jackPot.close();
  await jackPot.lotterySettlement();
  await jackPot.redeem([1]);



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

  // const info = await jackPot.getValidatorsInfo();
  // const validators = await jackPot.getAllValidators(info.validatorsCount);
  // console.log(validators);

  // await jackPot.checkStakerOut();

  // await jackPot.setValidator("0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e");

}, 0);
