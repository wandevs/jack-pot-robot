const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const keys = require('../keys/key-pairs.json');

async function customerBuyAndRedeem() {
  let codeNumber = 0;
  for (let j = 0; j < keys.length; j++) {
    log.info(`try buy, from = ${keys[j].address}`);
    const codes = [], amounts = [];
    for (let i = 0; i < 50; i++) {
      const code = codeNumber % 10000;
      const amount = 10;

      codes.push(code);
      amounts.push(amount);
      codeNumber++;
    }
    try {
      await jackPot.buy(codes, amounts, keys[j].privateKey, keys[j].address);
    } catch (e) {
      log.warn("buy exception:" + e);
      return;
    }
  }
}

async function customerClean() {
  for (let j = 0; j < keys.length; j++) {
    const userInfo = await jackPot.getUserCodeList(keys[j].address);
    if (userInfo.exits.length > 0) {
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

setTimeout(async () => {
  await customerBuyAndRedeem();
}, 0);