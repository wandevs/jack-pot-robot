
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
    if (!fs.existsSync(path.resolve(__dirname, "../../db"))) {
      fs.mkdirSync(path.resolve(__dirname, "../../db"));
    }
    if (!filePath) {
      filePath = path.resolve(__dirname, "../../db/robot.db")
    }

    // create table winner(
    //   id integer PRIMARY KEY,
    //   transactionHash char(66),
    //   blockNumber integer not null,
    //   winner char(42),
    //   amount char(82),
    //   isWithdraw boolean
    // );
    let db = null;
    if (!fs.existsSync(filePath)) {
      // db = new Sqlite3(filePath, {verbose: console.log});
      db = new Sqlite3(filePath);
      const address = process.env.JACKPOT_ADDRESS.toLowerCase();
      db.exec(`
        create table receipts (
          transactionHash char(66) NOT NULL PRIMARY KEY,
          blockNumber integer not null,
          "from" char(42),
          status boolean,
          "to" char(42),
          transactionIndex integer
        );

        create table balance_change (
          id integer PRIMARY KEY,
          transactionHash char(66),
          blockNumber integer not null,
          event char(40),
          amount char(82),
          "from" char(42),
          fromBalance char(82),
          "to" char(42),
          toBalance char(82)
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
      db.prepare(`insert into scan values (?)`).run(parseInt(process.env.SCAN_FROM) - 1);

      // db.prepare(`insert into users values (${process.env.JACKPOT_ADDRESS}, "0")`).run();

      // create unique index block_number_tx_index on receipts (blockNumber, transactionIndex);
    } else {
      // db = new Sqlite3(filePath, {verbose: console.log});
      db = new Sqlite3(filePath);
    }
    this.db = db;
  }

  insertReceipt(receipt) {
    const insert = this.db.prepare(`insert into receipts values (@transactionHash, @blockNumber, @from, ?, @to, @transactionIndex)`);
    let status = receipt.status;
    if (typeof(receipt.status) === 'string') {
      status = receipt.status === '0x1';
    }
    insert.run(receipt, status ? 1 : 0);
  }
  insertBalanceChange(balanceChange) {
    return this.db.prepare(`insert into balance_change values (null,@transactionHash, @blockNumber,@event,@amount,@from,@fromBalance,@to,@toBalance)`).run(balanceChange);
  }

  getUser(address) {
    return this.db.prepare(`select * from users where address = ?`).get(address.toLowerCase());
  }
  insertUser(user) {
    return this.db.prepare(`insert into users values (@address, @balance)`).run(user);
  }
  updateUser(user) {
    return this.db.prepare(`update users set balance = @balance where address = @address`).run(user);
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