const assert = require("assert");

require("dotenv").config({path: `${__dirname}/../.env.local`});
const jpApi = require("../abi/jacks-pot");
const wanChain = require("../src/lib/wanchain").wanChain;
const wanChain_contract = new wanChain.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
// const iWan = require("../src/lib/iwan").wanChain;
// const iWan_contract = new iWan.web3.eth.Contract(jpApi, process.env.JACKPOT_ADDRESS);
const web3 = require("../src/lib/wanchain").web3;
const wanHelper = require('../src/lib/wanchain-helper');
const jackPot = require('../src/lib/jack-pot');


// describe("jack-pot test", function () {
//   this.timeout(16000);

// });

String.prototype.StrCut2Arr=function(n){
	var str = this;
	var arr = [];
	var len = Math.ceil(str.length/n);
	for (var i=0; i < len; i++) {
		if (str.length >= n) {
			var strCut=str.substring(0,n);
			arr.push(strCut);
			str=str.substring(n);
		} else {
			str=str;
			arr.push(str);
		}
	}
	return arr;
}
const codeStr = "0000000000000000000000000000000000000000000000000000000000000fa4000000000000000000000000000000000000000000000000000000000000200c0000000000000000000000000000000000000000000000000000000000001c3d00000000000000000000000000000000000000000000000000000000000009700000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000013e000000000000000000000000000000000000000000000000000000000000108200000000000000000000000000000000000000000000000000000000000015fe00000000000000000000000000000000000000000000000000000000000017aa000000000000000000000000000000000000000000000000000000000000012f00000000000000000000000000000000000000000000000000000000000010fa0000000000000000000000000000000000000000000000000000000000001cb6000000000000000000000000000000000000000000000000000000000000070f0000000000000000000000000000000000000000000000000000000000001dfc000000000000000000000000000000000000000000000000000000000000008b000000000000000000000000000000000000000000000000000000000000064e00000000000000000000000000000000000000000000000000000000000014010000000000000000000000000000000000000000000000000000000000001fcd0000000000000000000000000000000000000000000000000000000000000f8a00000000000000000000000000000000000000000000000000000000000017600000000000000000000000000000000000000000000000000000000000001f5e0000000000000000000000000000000000000000000000000000000000000cdc0000000000000000000000000000000000000000000000000000000000001b720000000000000000000000000000000000000000000000000000000000001a4100000000000000000000000000000000000000000000000000000000000003f300000000000000000000000000000000000000000000000000000000000000270000000000000000000000000000000000000000000000000000000000000c4d0000000000000000000000000000000000000000000000000000000000000ce000000000000000000000000000000000000000000000000000000000000000a6000000000000000000000000000000000000000000000000000000000000159600000000000000000000000000000000000000000000000000000000000015410000000000000000000000000000000000000000000000000000000000000896000000000000000000000000000000000000000000000000000000000000147800000000000000000000000000000000000000000000000000000000000013290000000000000000000000000000000000000000000000000000000000001a410000000000000000000000000000000000000000000000000000000000000657000000000000000000000000000000000000000000000000000000000000158000000000000000000000000000000000000000000000000000000000000005c90000000000000000000000000000000000000000000000000000000000001f32000000000000000000000000000000000000000000000000000000000000066d000000000000000000000000000000000000000000000000000000000000076f000000000000000000000000000000000000000000000000000000000000040500000000000000000000000000000000000000000000000000000000000021750000000000000000000000000000000000000000000000000000000000001ced000000000000000000000000000000000000000000000000000000000000169f00000000000000000000000000000000000000000000000000000000000004a700000000000000000000000000000000000000000000000000000000000000b3000000000000000000000000000000000000000000000000000000000000219a00000000000000000000000000000000000000000000000000000000000006690000000000000000000000000000000000000000000000000000000000000ef0";
const codes = codeStr.StrCut2Arr(64);
// while ( codes.length > 0 ) {
//   const item = codes.pop();
//   const it = codes.find(j => { return j === item; });
//   console.log(it);
// }

// describe(("Jack pot contract", function () {
//   it('getStorageAt', async function() {
//     const a = await jackPot.getScMap("0x5f9e5b14128a4ec9b0ce4db2d4f42e42606054dd", "0");
//   })
// })) 

async function printSM(slot, end) {
	if (slot < end) {
		const a = await jackPot.getScMap("0x5f9e5b14128a4ec9b0ce4db2d4f42e42606054dd", slot);
		if (typeof (a) !== "string")
			console.log(JSON.stringify(a));
		else {
			console.log(a);
		}

		setTimeout(async () => {
			await printSM((slot + 1), end);
		})
	}
}

async function getScMember(slot, blockNumber) {
	const result = await web3.eth.getStorageAt(
		process.env.JACKPOT_ADDRESS,
		slot,
		blockNumber
	);

	return result;
}

async function getScPositionMember(position, blockNumber) {
	const positionSlot = "0x" + web3.utils.leftPad(position.toString(16).replace(/^0x/i,''), 64);
	const result = await getScMember(positionSlot, blockNumber);
	return result;
}

function getSlotOld(key, slot, offset = 0) {
	const padKey = web3.utils.leftPad(key.toString(16).replace(/^0x/i,''), 64);
	const padSlot = web3.utils.leftPad(slot.toString(16).replace(/^0x/i,''), 64);
	const content = "0x" + padKey + padSlot
	const dynSlot = web3.utils.keccak256(content, { encoding: 'hex' });
	const newSlot = web3.utils.toBN(dynSlot).add(web3.utils.toBN(offset));
	return "0x" + newSlot.toString("hex");
}

function getSlot(key, slot, offset = 0) {
	const dynSlot = web3.utils.soliditySha3(web3.utils.toBN(key), web3.utils.toBN(slot));
	const newSlot = web3.utils.toBN(dynSlot).add(web3.utils.toBN(offset));
	return "0x" + newSlot.toString("hex");
}

// 10 
// struct UserInfo {
// 	uint256 prize;
// 	uint256 codeCount;
// 	mapping(uint256 => uint256) indexCodeMap;      // map: index => userCode (index start from 0)
// 	mapping(uint256 => uint256) codeIndexMap;      // map: userCode => index
// 	mapping(uint256 => uint256) codeAmountMap;     // map: userCode => amount
// }
async function getUserInfo(address, blockNumber) {
	const position = 10;
	const userInfo = {address: address};

	const prizeSlot = getSlot(address, position, 0);
	const prize = web3.utils.toBN(await getScMember(prizeSlot, blockNumber)).toNumber();
	console.log(`prize = ${prize}`);
	userInfo.prize = web3.utils.toBN(prize);

	const codeCountSlot = getSlot(address, position, 1);
	const codeCount = web3.utils.toBN(await getScMember(codeCountSlot, blockNumber)).toNumber();
	console.log(`codeCount = ${codeCount}`);
	userInfo.codeCount = web3.utils.toBN(codeCount);

	userInfo.indexCodeMap = {};
	userInfo.codeIndexMap = {};
	userInfo.codeAmountMap = {};

	const userInfoMap_indexCodeMap_Slot = getSlot(address, position, 2);
	const userInfoMap_codeIndexMap_Slot = getSlot(address, position, 3);
	const userInfoMap_codeAmountMap_Slot = getSlot(address, position, 4);

	for(let i = 0; i < codeCount; i++) {
		const indexCodeMapSlot = getSlot(i, userInfoMap_indexCodeMap_Slot);
		const code = await getScMember(indexCodeMapSlot, blockNumber);
		console.log(`i = ${i}, code = ${code}`);
		userInfo.indexCodeMap[i] = web3.utils.toBN(code);

		const codeIndexMapSlot = getSlot(code, userInfoMap_codeIndexMap_Slot);
		const index = await getScMember(codeIndexMapSlot, blockNumber);
		console.log(`code = ${code}, index = ${index}`);
		userInfo.codeIndexMap[code] = web3.utils.toBN(index);

		const slot = getSlot(code, userInfoMap_codeAmountMap_Slot);
		const amount = await getScMember(slot, blockNumber);
		console.log(`i = ${i}, amount = ${amount}`);
		userInfo.codeAmountMap[i] = web3.utils.toBN(amount);
	}

	return userInfo;
}
// 6
// uint256 public maxCount = 50;
async function maxCount(blockNumber) {
	const mc = await getScPositionMember(6, blockNumber);
	console.log(`maxCount = ${mc}`);
}

// 11
// mapping(uint256 => CodeInfo) public indexCodeMap;

// 12
// uint256 public pendingRedeemStartIndex;
async function pendingRedeemStartIndex(blockNumber) {
	const startIndex = await getScPositionMember(12, blockNumber);
	console.log(`pendingRedeemStartIndex = ${startIndex}`);
}

// 13
// uint256 public pendingRedeemCount;
async function pendingRedeemCount(blockNumber) {
	const redeemCount = await getScPositionMember(13, blockNumber);
	console.log(`pendingRedeemCount = ${redeemCount}`);
}

// 14
// mapping(uint256 => PendingRedeem) public pendingRedeemMap;
async function getPendingRedeemMap(address, userInfo, blockNumber) {
}

// mapping(address => mapping(uint256 => uint256)) public pendingRedeemSearchMap;
async function getPendingRedeemSearchMap(address, userInfo, blockNumber) {
	const pendingRedeemSearchMap_Map_Slot = getSlot(address, 15, 0);
	for(let i = 0; i < userInfo.codeCount; i++) {
		const indexCodeMapSlot = getSlot(userInfo.indexCodeMap[i], pendingRedeemSearchMap_Map_Slot);
		const code = await getScMember(indexCodeMapSlot, blockNumber);
		console.log(`code = ${code}, index = ${indexCodeMapSlot}`);
	}
}

setTimeout(async () => {
	const mc = await maxCount();
	const pendingRedeemStartIndex_data = await pendingRedeemStartIndex();
	const pendingRedeemCount_data = await pendingRedeemCount();
	const userInfo = await getUserInfo("0x5f9e5b14128a4ec9b0ce4db2d4f42e42606054dd");
	// const pendingRedeemSearchMap = await getPendingRedeemSearchMap(userInfo.address, );
	// await printSM(0, 45);

}, 0);