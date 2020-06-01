
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
      const address = process.env.JACKPOT_ADDRESS.toLowerCase();
      db.exec(`
        create table receipts (
          transactionHash char(66) NOT NULL PRIMARY KEY,
          blockNumber integer not null unique,
          "from" char(42),
          status boolean,
          "to" char(42),
          transactionIndex integer
        );

        create table blocks (
          blockHash char(66) PRIMARY KEY NOT NULL,
          blockNumber integer UNIQUE 
        );

        create table users (
          address char(66) PRIMARY KEY NOT NULL,
          balance char(82)
        );

        create table scan (
          blockNumber integer
        );

      `);
      db.prepare(`insert into users values (?, ?)`).run(address,"0");
      db.prepare(`insert into scan values (?)`).run(parseInt(process.env.SCAN_FROM));

      // db.prepare(`insert into users values (${process.env.JACKPOT_ADDRESS}, "0")`).run();

      // create unique index block_number_tx_index on receipts (blockNumber, transactionIndex);
    } else {
      db = new Sqlite3(filePath, {verbose: console.log});
    }
    this.db = db;
  }

  wrapTransaction(cb) {
    const cbTransaction = this.db.transaction(cb)
    return cbTransaction;
  }

  insertReceipt(receipt) {
    const insert = this.db.prepare(`insert into receipts values (@transactionHash, @blockNumber, @from, ?, @to, @transactionIndex)`);
    let status = receipt.status;
    if (typeof(receipt.status) === 'string') {
      status = receipt.status === '0x1';
    }
    insert.run(receipt, status ? 1 : 0);
  }

  getUser(address) {
    return this.db.prepare(`select * from users where address = ${address}`).get();
  }
  insertUser(user) {
    return this.db.prepare(`insert into users value (@address, @balance)`).run(user);
  }
  updateUser(user) {
    return this.db.prepare(`update users set balance = @balance`).run(user);
  }

  // UPDATE {Table} SET {Column} = {Column} + {Value} WHERE {Condition}
  getScan() {
    return this.db.prepare(`select blockNumber from scan`).get();
  }

  insertScan(item) {
    this.db.prepare(`insert into scan values (@blockNumber)`).run(item);
  }

  updateScan(item) {
    this.db.prepare(`update scan set blockNumber = @blockNumber`).run(item);
  }

  selectAll() {
    const db = this.db;

    const selectAll = db.prepare(`select * from receipts order by blockNumber`);
    const receipts = selectAll.all();
    receipts.forEach(receipt => {
      receipt.status = receipt.status ? true : false
    })

    console.log(JSON.stringify(receipts));
    return receipts;
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