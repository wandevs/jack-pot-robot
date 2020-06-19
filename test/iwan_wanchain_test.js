const assert = require("assert");

require("dotenv").config({path: `${__dirname}/../.env.testnet`});
const jpApi = require("../abi/jacks-pot");
const wanChain = require("../src/lib/wanchain").wanChain;
const wanChain_contract = new wanChain.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
const iWan = require("../src/lib/iwan").wanChain;
const iWan_contract = new iWan.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
const web3 = require("../src/lib/wanchain").web3;
const wanHelper = require('../src/lib/wanchain-helper');
const {sleep} = require("../src/lib/utils")

before(function () {
  console.log("init jack-pot test");
});
after(function () {
  iWan.closeEngine();
  wanChain.closeEngine();
  console.log("done test");
});

describe("iWan == wanChain test", function () {
  this.timeout(16000);

  it('getTxCount', async function() {
    const a = await wanChain.getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS);
    const b = await iWan.getTxCount(process.env.JACKPOT_OPERATOR_ADDRESS);
    assert.strictEqual(a > 0, true, "nonce should > 0");
    assert.strictEqual(a, b, "count should be same");
  });

  it('getBalance', async function() {
    const a = await wanChain.getBalance("0xa4626e2bb450204c4b34bcc7525e585e8f678c0d");
    const b = await iWan.getBalance("0xa4626e2bb450204c4b34bcc7525e585e8f678c0d");
    assert.strictEqual(a > 0, true, "balance should > 0");
    assert.strictEqual(a, b);
  });
  it.only('getBalanceByBlockNumber', async function() {
    // await sleep(5000)
    console.log("getBalanceByBlockNumber...");
    const a = await wanChain.getBalanceByBlockNumber("0xa4626e2bb450204c4b34bcc7525e585e8f678c0d", 7800000);
    // const b = await iWan.getBalance("0xa4626e2bb450204c4b34bcc7525e585e8f678c0d", 7800000);
    // assert.strictEqual(a > 0, true, "balance should > 0");
    // assert.strictEqual(a, b);
    assert.strictEqual(a, "288470142661951688668");
  });

  it('getScVar', async function() {
    const a = await wanChain.getScVar("poolInfo", wanChain_contract, jpApi);
    const b = await iWan.getScVar("poolInfo", iWan_contract, jpApi);

    const keys = Object.keys(a);
    assert.strictEqual(keys.length > 0 && keys.length === Object.keys(b).length, true, "fields's length should be same");
    Object.keys(a).forEach((k) => {
      assert.strictEqual(web3.utils.toBN(a[k]).toString(10), web3.utils.toBN(b[k]).toString(10))
    })
  });

  it('getScFun', async function() {
    const a = await wanChain.getScFun("getPendingAmount", [], wanChain_contract, jpApi);
    const b = await iWan.getScFun("getPendingAmount", [], iWan_contract, jpApi);
    assert.strictEqual(a, b, "getPendingAmount failed");
  });


  it('getBlockNumber', async function() {
    const a = await wanChain.getBlockNumber();
    const b = await iWan.getBlockNumber();
    assert.strictEqual(a + 1 >= b, true);
    assert.strictEqual(a - 1 <= b, true);
  });

  it('getTransactionReceipt', async function() {
    const a = await wanChain.getTransactionReceipt("0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f");
    // {
    //   "blockHash": "0x468e15681f9968a95ee0df04063369385cb210e2a1837c47742d10cfb6e45a2a",
    //   "blockNumber": 7384158,
    //   "contractAddress": null,
    //   "cumulativeGasUsed": 38355,
    //   "from": "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
    //   "gasUsed": 38355,
    //   "logs": [
    //   {
    //     "address": "0xd8b67E4c66a4Ab51FA8B7a30A82c63FF792b79C0",
    //     "topics": [
    //       "0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16"
    //     ],
    //     "data": "0x",
    //     "blockNumber": 7384158,
    //     "transactionHash": "0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f",
    //     "transactionIndex": 0,
    //     "blockHash": "0x468e15681f9968a95ee0df04063369385cb210e2a1837c47742d10cfb6e45a2a",
    //     "logIndex": 0,
    //     "removed": false,
    //     "id": "log_02b8bc9b"
    //   }
    // ],
    //   "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002040000000000040000000000000000000000",
    //   "status": true,
    //   "to": "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
    //   "transactionHash": "0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f",
    //   "transactionIndex": 0
    // }
    const b = await iWan.getTransactionReceipt("0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f");
    // {
    //   "transactionHash": "0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f",
    //   "blockHash": "0x468e15681f9968a95ee0df04063369385cb210e2a1837c47742d10cfb6e45a2a",
    //   "blockNumber": 7384158,
    //   "contractAddress": null,
    //   "cumulativeGasUsed": 38355,
    //   "from": "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
    //   "gasUsed": 38355,
    //   "logs": [
    //   {
    //     "topics": [
    //       "0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16"
    //     ],
    //     "_id": "5ebe514d11fc858304688c47",
    //     "address": "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
    //     "data": "0x",
    //     "blockNumber": 7384158,
    //     "transactionHash": "0xf7bca2f5123fe448a8093bd025811a816c3be9e84bc7e11074122c95cc6d540f",
    //     "transactionIndex": 0,
    //     "blockHash": "0x468e15681f9968a95ee0df04063369385cb210e2a1837c47742d10cfb6e45a2a",
    //     "logIndex": 0,
    //     "removed": false
    //   }
    // ],
    //   "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002040000000000040000000000000000000000",
    //   "status": "0x1",
    //   "to": "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
    //   "transactionIndex": 0
    // }
    assert.strictEqual(a.logs.length, 1, "log error");
    assert.deepStrictEqual(a.logs[0].topics, b.logs[0].topics, "receipt should be same");
  });

  it('getStakerInfo', async function() {
    const blockNumber = await wanChain.getBlockNumber();
    const a = await wanChain.getStakerInfo(blockNumber);
    const b = await iWan.getStakerInfo(blockNumber);
    assert.strictEqual(a.length > 0, true, "stake info should has many");
    assert.deepStrictEqual(a, b, " info should same");
  });

  it('getTxsBetween', async function() {
    const from = 7607124;
    const to = 7607124;
    const txs1 = await wanChain.getTxsBetween(process.env.JACKPOT_ADDRESS, from, to);
    const txs = await iWan.getTxsBetween(process.env.JACKPOT_ADDRESS, from, to);
    console.log(JSON.stringify(txs1));
    console.log(JSON.stringify(txs));
  });

  it('getRandom', async function() {
    const epochId = 18397;
    const blockNumber = 7384591;
    const ra = await wanChain.getRandom(epochId, blockNumber);
    const rb = await iWan.getRandom(epochId, blockNumber);
    assert.strictEqual(ra, rb, "random should be same");
  });

  it('getEpochID', async function() {
    const a = await wanChain.getEpochID();
    const b = await iWan.getEpochID();
    assert.strictEqual(a + 1 >= b, true);
    assert.strictEqual(a <= b, true);
  });

  it('getTimeByEpochID', async function() {
    const epochId = 18397;
    const a = await wanChain.getTimeByEpochID(epochId);
    const b = await iWan.getTimeByEpochID(epochId);
    assert.strictEqual(a, 1589500800);
    assert.strictEqual(a, b);
  });

});

