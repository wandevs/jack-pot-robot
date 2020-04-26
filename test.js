// const schedule = require('node-schedule');
//
// const  scheduleCronstyle = ()=>{
//   //每分钟的第30秒定时执行一次:
//     schedule.scheduleJob('30 * * * * *',()=>{
//         console.log('scheduleCronstyle:' + new Date());
//     });
// }
//
// scheduleCronstyle();

// * * * * * *
// ┬ ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │ |
// │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
// │ │ │ │ └───── month (1 - 12)
// │ │ │ └────────── day of month (1 - 31)
// │ │ └─────────────── hour (0 - 23)
// │ └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
const { getTxCount, sendRawTxByWeb3 } = require('./wanchain')
const dotEnv = require("dotenv");
dotEnv.config();

const WanchainTx = require('wanchainjs-tx');
const BN = require('bn.js');
const web3 = require('web3');

setTimeout( async () => {
    let nonce = await getTxCount(process.env.JACKPOT_OWNER_ADDRESS);
    nonce = nonce + 1;
    const txParams = {
        Txtype: 0x01,
        nonce: nonce,
        gasPrice: process.env.GASPRICE,
        gasLimit: process.env.GASLIMIT,
        to: "0x941c3f932182dfa95a30dc5859c062d4ff8e6859",
        value: '0x' + new BN("100000000000000000000").toString('hex'),
        data: '0x',
        chainId: 0x06,
    };
    console.log(JSON.stringify(txParams));
    const privateKey = Buffer.from('a4369e77024c2ade4994a9345af5c47598c7cfb36c65e8a4a3117519883d9014', 'hex');

    const tx = new WanchainTx(txParams);
    tx.sign(privateKey);
    const serializedTx = tx.serialize();
    const rawTx = '0x' + serializedTx.toString('hex');
    const err = await sendRawTxByWeb3(rawTx);
    console.log(err);
}, 0);
