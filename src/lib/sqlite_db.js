
const Sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify, sleep } = require("./utils");

console.log(os.platform());
console.log(os.homedir());

class DB {
  constructor() {
  }

  init(filePath) {
    if (!filePath) {
      filePath = path.resolve(__dirname, "../../db/robot.db")
    }

    let db = null;
    if (!fs.existsSync(filePath)) {
      db = new Sqlite3(filePath, {verbose: console.log});
      db.exec(`
        create table receipt (
          transactionHash char(66) NOT NULL PRIMARY KEY,
          blockNumber integer not null unique,
          "from" char(42),
          status boolean,
          "to" char(42),
          transactionIndex integer
        );

        create table block (
          blockHash char(66) PRIMARY KEY NOT NULL,
          blockNumber integer UNIQUE 
        );

        create table account (
          balance char(82),
          address char(66)
        );

        create table scanInfo (
          blockNumber integer
        );

        create unique index block_number_tx_index on receipt (blockNumber, transactionIndex);
      `);
    } else {
      db = new Sqlite3(filePath, {verbose: console.log});
    }
    this.db = db;
  }

  insertReceipt(receipts) {
    const db = this.db;

    const insert = db.prepare(`insert into receipt values (@transactionHash, @blockNumber, @from, ?, @to, @transactionIndex)`);
    const insertMany = db.transaction((receipts) => {
      for (const receipt of receipts) {
        insert.run(receipt, receipt.status ? 1 : 0);
      }
    });

    insertMany(receipts);
  }

  // UPDATE {Table} SET {Column} = {Column} + {Value} WHERE {Condition}
  getScanBlockNumber() {
    const db = this.db;
    const sql = db.prepare(`select * from scanInfo`);
    const scanInfo = sql.run();
    console.log(JSON.stringify(scanInfo));
    return scanInfo;
  }

  saveScanBlockNumber(blockNumber) {
    const db = this.db;
    const sql = db.prepare(`update scanInfo set blockNumber = ${blockNumber}`);
    try {
      const b = sql.run();
      console.log(JSON.stringify(b));
      return b;
    } catch(e) {
      console.log(`saveScanBlockNumber ${blockNumber} error = ${e}`);
    }
  }

  selectAll() {
    const db = this.db;

    const selectAll = db.prepare(`select * from receipt order by blockNumber`);
    const receipts = selectAll.all();
    receipts.forEach(receipt => {
      receipt.status = receipt.status ? true : false
    })

    console.log(JSON.stringify(receipts));
    return receipts;
  }

  update(receipt) {
    // const db = this.db;

    // const update = db.prepare(`update `)
  }

  close() {
    if (this.db) {
      const db = this.db;
      db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('close the database connection.');
      });
      this.db = null;
    }
  }
}

const db = new DB();

module.exports = db;