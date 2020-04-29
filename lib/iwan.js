const iWanClient = require('iwan-sdk');
require("dotenv").config({path: __dirname + '/../.env.local'});

//Subject to https://iwan.wanchain.org
const option = {
  url: "apitest.wanchain.org",
  port:8443,
  flag:"ws",
  version:"v3",
  timeout:300000
};
const apiClient = new iWanClient(process.env.IWAN_APIKEY, process.env.IWAN_SECRETKEY, option);

const getBalance = async (addr) => {
  try {
    return await apiClient.getBalance('WAN', addr);
  } catch (err) {
    console.log(err);
  }
};

const close = () => {
  apiClient.close();
};

if (!module.parent) {
  // do some test
  setTimeout(async () => {
    const balance = await getBalance('0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8');
    console.log("Balance result is " + balance);

    // close wss
    close();
  }, 0);
}

module.exports = {
  getBalance,
  close
};