const assert = require("assert");

require("dotenv").config({path: `${__dirname}/../.env.testnet`});
const jpApi = require("../abi/jacks-pot");
const wanChain = require("../src/lib/wanchain").wanChain;
const wanChain_contract = new wanChain.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
const iWan = require("../src/lib/iwan").wanChain;
const iWan_contract = new iWan.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
const web3 = require("../src/lib/wanchain").web3;
const wanHelper = require('../src/lib/wanchain-helper');


describe("jack-pot test", function () {
  this.timeout(16000);

});

