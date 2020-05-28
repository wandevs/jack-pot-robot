const assert = require("assert");
const db = require('../src/lib/sqlite_db');
const fs = require('fs');
const path = require('path');

before(function () {
  this.timeout(16000);
  console.log("init db test");
  const filePath = path.resolve(__dirname, "../db/robot_test.db");
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  db.init(filePath);
});

after(function () {
  db.close();
  console.log("end db test");
});

describe("sqlite3 test", function () {
  this.timeout(16000);
  const receipts = [
    {
      blockHash: "0xedd74921c7584bbc42a9bb9cdc51ac257c66850b7d8985e024f60c9871877c4d",
      blockNumber: 295316,
      contractAddress: "0x9c6f5b86595da99a769217af38b6599eba1806ef",
      cumulativeGasUsed: 6051088,
      from: "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e",
      gasUsed: 6051088,
      logs: [{
          address: "0x9c6f5b86595da99a769217af38b6599eba1806ef",
          blockHash: "0xedd74921c7584bbc42a9bb9cdc51ac257c66850b7d8985e024f60c9871877c4d",
          blockNumber: 295316,
          data: "0x",
          logIndex: 0,
          removed: false,
          topics: ["0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000002d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"],
          transactionHash: "0x066281ca869c2c37a1c8874d822629495d4cfc362006bd945f292980e6be4b7a",
          transactionIndex: 0
      }],
      logsBloom: "0x00000000000000000000000000000000000000000000000000800000000100000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000001000000000000004000000000000000000000020000000000000000000800000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000010000000000000000000000",
      status: "0x1",
      to: "0x3d0e7c0813a51d3bd1d08246af2a8a7a57d8922e",
      transactionHash: "0x066281ca869c2c37a1c8874d822629495d4cfc362006bd945f292980e6be4b7a",
      transactionIndex: 0
    }
  ]

  it('insert receipt', function() {
    db.insertReceipt(receipts);
  })

  it('select all', function() {
    db.selectAll();
  })

  it.only('getScanBlockNumber', async function() {
    const scanInfo = db.saveScanBlockNumber(295315);
    console.log(`scan info ${scanInfo}`);
  });
});

