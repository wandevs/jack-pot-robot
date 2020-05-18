const fs = require('fs');
const path = require('path');
const generateKeyPair = require('./lib/wanchain-helper').generateKeyPair;

const loadKeys = () => {
  const content = fs.readFileSync(path.resolve(__dirname, '../keys/key-pairs.json'), 'utf8');
  const keys = JSON.parse(content);
  const count = parseInt(process.env.CUSTOMER_COUNT);
  while(keys.length < count) {
    keys.push(generateKeyPair());
  }

  fs.writeFileSync(path.resolve(__dirname, '../keys/key-pairs.json'), JSON.stringify(keys), 'utf8');
  return keys;
}
const keys = loadKeys();

module.exports = keys;
