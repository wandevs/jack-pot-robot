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
    },
    {
      blockHash: "0x8f50ab97e5e27f646f5ee615afafffa9cf82f7edc1e4cba7fe04f442a93f1ea2",
      blockNumber: 7607178,
      contractAddress: null,
      cumulativeGasUsed: 38376,
      from: "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
      gasUsed: 38376,
      logs: [],
      logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      status: "0x0",
      to: "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
      transactionHash: "0x9d2dca7ced99049b22d3f38d5c7abe5ee0f9f83ab952281d4b3cb99771909fdd",
      transactionIndex: 0
    },
    {
      blockHash: "0x6bbf131e64e74b727f0b881ac71dc60c8c6f90940376afe973b3a4d3a7429914",
      blockNumber: 7607183,
      contractAddress: null,
      cumulativeGasUsed: 38421,
      from: "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
      gasUsed: 38421,
      logs: [{
          address: "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
          blockHash: "0x6bbf131e64e74b727f0b881ac71dc60c8c6f90940376afe973b3a4d3a7429914",
          blockNumber: 7607183,
          data: "0x",
          logIndex: 0,
          removed: false,
          topics: ["0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16"],
          transactionHash: "0xf2af7250298c34b95f5b737dec1dded3c26c2bc2c36bc951b9ed9f01b932395a",
          transactionIndex: 0
      }],
      logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002040000000000040000000000000000000000",
      status: false,
      to: "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
      transactionHash: "0xf2af7250298c34b95f5b737dec1dded3c26c2bc2c36bc951b9ed9f01b932395a",
      transactionIndex: 0
    },
    {
      "blockHash": "0x608036c7ac1fa433f8fb2260dbcc13404b16bdc1acf4eace9c36f9fee1966080",
      "blockNumber": 7607124,
      "contractAddress": null,
      "cumulativeGasUsed": 38421,
      "from": "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
      "gasUsed": 38421,
      "logs": [{
        "address": "0xd8b67E4c66a4Ab51FA8B7a30A82c63FF792b79C0",
        "topics": ["0xe0828ebc681453a239bd3a107defe316328dc7d2aec54a5d772da80fc136ce16"],
        "data": "0x",
        "blockNumber": 7607124,
        "transactionHash": "0xa3ae54b26ada0b6392e1e1a35fa723327967ca506af8f70a4e9fad21e15ec47c",
        "transactionIndex": 0,
        "blockHash": "0x608036c7ac1fa433f8fb2260dbcc13404b16bdc1acf4eace9c36f9fee1966080",
        "logIndex": 0,
        "removed": false,
        "id": "log_893bf8ba"
      }],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002040000000000040000000000000000000000",
      "status": true,
      "to": "0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0",
      "transactionHash": "0xa3ae54b26ada0b6392e1e1a35fa723327967ca506af8f70a4e9fad21e15ec47c",
      "transactionIndex": 0
    }
  ];

  it('insert receipts', function() {
    receipts.forEach((receipt) => { db.insertReceipt(receipt); })
  })

  it('select all', function() {
    db.selectAll();
  })

  it('insert', function() {
    db.insertScan({blockNumber: 333});
    const a = db.getScan();
    assert.equal(a.blockNumber, 333)
  })

  it('update', function() {
    db.updateScan({blockNumber: 111});
    const b = db.getScan();
    assert.equal(b.blockNumber, 111);
  })

  it('tx batch update', function() {
    const tx = db.db.transaction(function() {
      db.updateScan({blockNumber: 111});
      let s1 = db.getScan();
      assert.equal(s1.blockNumber, 111);
      db.updateScan({blockNumber: 222});
      let s2 = db.getScan();
      assert.equal(s2.blockNumber, 222);
      db.updateScan({blockNumber: 333});
      let s3 = db.getScan();
      assert.equal(s3.blockNumber, 333);
    });
    tx();
  })

  it('insert balance change', function() {
    db.insertBalanceChange({
      transactionHash:"0x066281ca869c2c37a1c8874d822629495d4cfc362006bd945f292980e6be4b7a",
      blockNumber: 295316,
      event: "buy",
      amount: "0x100",
      from: "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e",
      fromBalance: "0x101",
      to: "0x3d0e7c0813a51d3bd1d08246af2a8a7a57d8922e",
      toBalance: "0x102",
    })
  })

  it('insert delegating_out', function() {
    db.insertDelegatingOut({
      balance: "0x101",
      createTime: 323
    })
    db.insertDelegatingOut({
      balance: "0x201",
      createTime: 223
    })
    const delegatingOut = db.getOldestDelegatingOut();
    console.log(JSON.stringify(delegatingOut));
  })

  it('delete delegating_out', function() {
    db.deleteDelegatingOut(1)
  })

  it('insert delegated_out', function() {
    db.insertDelegatedOut({
      balance: "0x101",
      createTime: 123
    })
  })
});

