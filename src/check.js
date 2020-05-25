const log = require('./lib/log');
const jackPot = require('./lib/jack-pot');
const wanChain = require(`./lib/${process.env.CHAIN_ENGINE}`).wanChain;
const web3 = require(`./lib/${process.env.CHAIN_ENGINE}`).web3;
const web3_ws = require(`./lib/${process.env.CHAIN_ENGINE}`).web3_ws;
const path = require('path');
const fs = require('fs');

async function checkBalance() {
  // emit FeeSend(owner(), feeAmount)
  // balance =   buy   + runDelegateOut   + subsidy       + posPrize（暂时无法得到）
  //          - redeem - runDelegateIn    - subsidyRefund - feeAmount              - prizeWithdraw
  //
  // buy = emit Buy(msg.sender, msg.value, codes, amounts);
  // runDelegateOut = DelegateOut(validator, delegateOutAmount)  ===== delegateOutAmount, 只有记账，可能延迟到账, update时，demandDepositPool会增加，delegateOutAmount会置0
  // DelegateIn = emit DelegateIn(validatorsInfo.currentValidator, delegateAmount)
  // redeem = user.transfer(totalAmount);
  // subsidyRefund = SubsidyRefund(refundingAddress, singleAmount)
  // feeAmount => FeeSend(owner(), feeAmount)

  // update后 =》        prizePool + delegatePool + demandDepositPool  =   balance
}

function sleep(ms) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			resolve();
		}, ms);
	})
};

function promise(func, paras=[], obj=null){
  return new Promise(function(success, fail){
      function _cb(err, result){
          if(err){
              fail(err);
          } else {
              success(result);
          }
      }
      paras.push(_cb);
      func.apply(obj, paras);
  });
}

function promiseEvent(func, paras=[], obj=null, event){
  return new Promise(function(success, fail){
      let res = func.apply(obj, paras);
      obj.on(event, function _cb(err){
          if(err){
              fail(err);
          } else {
              success(res);
          }
      })
  });
}

const buyEvent = web3.utils.keccak256("Buy(address,uint256,uint256[],uint256[])");
const redeemEvent = web3.utils.keccak256("Redeem(address,bool,uint256[],uint256)");
const gasNotEnoughEvent = web3.utils.keccak256("GasNotEnough()");
const prizeWithdrawEvent = web3.utils.keccak256("PrizeWithdraw(address,bool,uint256)");
const updateSuccessEvent = web3.utils.keccak256("UpdateSuccess()");
const subsidyRefundEvent = web3.utils.keccak256("SubsidyRefund(address,uint256)");
const randomGenerateEvent = web3.utils.keccak256("RandomGenerate(uint256,uint256)");
const lotteryResultEvent = web3.utils.keccak256("LotteryResult(uint256,uint256,uint256,address[],uint256[])");
const feeSendEvent = web3.utils.keccak256("FeeSend(address,uint256)");
const delegateOutEvent = web3.utils.keccak256("DelegateOut(address,uint256)");
const delegateInEvent = web3.utils.keccak256("DelegateIn(address,uint256)");
const subsidyInEvent = web3.utils.keccak256("SubsidyIn(address,uint256)");

function buy(log) {
  log.topics.length = 2;
}

function redeem(log) {

}

function gasNotEnough(log) {

}

function prizeWithdraw(log) {

}

function updateSuccess(log) {

}

function subsidyRefund(log) {

}

function randomGenerate(log) {

}

function lotteryResult(log) {

}

function feeSend(log) {

}

function delegateOut(log) {

}

function delegateIn(log) {

}

function subsidyIn(log) {

}

const handlers = {};

handlers[buyEvent] = buy;
handlers[redeemEvent] = redeem;
handlers[gasNotEnoughEvent] = gasNotEnough;
handlers[prizeWithdrawEvent] = prizeWithdraw;
handlers[updateSuccessEvent] = updateSuccess;
handlers[subsidyRefundEvent] = subsidyRefund;
handlers[randomGenerateEvent] = randomGenerate;
handlers[lotteryResultEvent] = lotteryResult;
handlers[feeSendEvent] = feeSend;
handlers[delegateOutEvent] = delegateOut;
handlers[delegateInEvent] = delegateIn;
handlers[subsidyInEvent] = subsidyIn;

// for (it in handlers) {
//   `
//   it = 0xf92806ed4b288c6cb9d35fccadbc6023b411ff69030ae055ecf9785b18165324
//   it = 0x02768cf47bd502ac2b9739723150cb77b0a98950fd067287c0a65d912149a9cb
//   it = 0x71238424bca4bc92d1155a651ad499bf349a54a66afd80751c17cab24c3cf895
//   it = 0x8a234cda743a9f7572dc9b0b6fb2ffebf42374bb768164a04c446483579abc65
//   it = 0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16
//   it = 0xf6a1f17846607f903615c8feba44ef2affda4abfe37aed75d2ada327cfd2bdb2
//   it = 0xd5610194069263ad05a235464e87dbb01883927cb85d14217be94e54e2458511
//   it = 0x7d15b902c9eb1ca6750ef6c45ce33fbff1d99b2c1c3f5de8229a2bacd27aa184
//   it = 0x30d7c727010bd07760adc4a97df25f841b278de6b8ce98061eae479bf21273f8
//   it = 0xa38c0de852a2fafa244b1ae0dd0a953a4c002d7b54cde932d9965d9b2d390e2d
//   it = 0x4e3aa93ab6e2e42feec798732c048a9d1e2fd6dbde19547e3ed903b3b0fea17e
//   it = 0xff1173e2426cd768da9dd8d89f7c1d32edd76f900de72ac722cd759f5a6c5185
//   `
//   console.log("it = " + it);
// }

// web3--1.20, new interface,   gwan need open --ws --wsport 8546 --wsorigins "*"
// async function eventFilter() {
//   const options = {
//     fromBlock: 27000, 
//     toBlock: 'latest', 
//     address: process.env.JACKPOT_ADDRESS, 
//     // topics: [buyEvent, "0x0000000000000000000000004db93be4e7e1bd5065ef49bf893e79301d9ee476"]
//   }

//   const subscription = web3_ws.eth.subscribe('logs', options, (error, result) => {
//     if (error) {
//       console.log("error:" + error);
//     } else {
//       console.log(JSON.stringify(result));
//     }
//   })
//   .on("data", function(log){
//     console.log("data:" + JSON.stringify(log));
//   })
//   .on("changed", function(log){
//     console.log("changed:" + log);
//   });
// }

// web3--1.20, new interface
// async function getPastEvents() {
//   const options = {
//     fromBlock: 279773, 
//     toBlock: 279773, 
//     address: process.env.JACKPOT_ADDRESS, 
//   }
//
//   jackPot.contract
//   const subscription = jackPot.contract.getPastEvents('allEvents', options, (error, results) => {
//     if (error) {
//       console.log("error:" + error);
//     } else {
//       console.log(JSON.stringify(result, null, 2));
//       results.forEach(result => {
//         result.returnValues.amounts.forEach(amount => {
          
//         })
//       })
//     }
//   })
// }

// scan between [from, to]
async function scanFailedTx(from, to) {
  const failedTxs = []
  const successTxs = []
  // scan all blocks
  const blocksPromise = [];
  for (let j = from; j <= to; j++) {
    // blocksPromise.push(new promise(web3.eth.getBlock, [j, true], web3.eth));
    blocksPromise.push();
  }
  const blocks = await Promise.all(blocksPromise);

  // scan all jackpot txs
  const receiptsPromise = [];
  blocks.forEach((block) => {
    if (block.transactions) {
      block.transactions.forEach(tx => {
        if (process.env.JACKPOT_ADDRESS === tx.to.toLowerCase()) {
          receiptsPromise.push(new promise(web3.eth.getTransactionReceipt, [tx.hash], web3.eth));
        }
      })
    }
  })
  const receipts = await Promise.all(receiptsPromise);
  receipts.sort()
  receipts.forEach((receipt) => {
    if (receipt) {
      if (receipt.status) {
        successTxs.push(receipt);
        // parse log
        const logs = receipt.logs;
        logs.forEach(log => {
          if (log.topics.length > 0) {
            handlers[log.topics[0]](log);
          }
        })
      } else {
        failedTxs.push(receipt);
      }
    }
  })
  if (failedTxs.length > 0) {
    // send mail
  }

  console.log(`success = ${successTxs.length}, failed = ${failedTxs.length}`)
}

async function scanAndCheck() {
  const blockNumber = await web3.eth.getBlockNumber();
}

setTimeout(async () => {
  await scanFailedTx();
  // await eventFilter();
  // await getPastEvents();
}, 0);