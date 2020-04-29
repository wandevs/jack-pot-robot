const log4js = require('log4js');
log4js.configure(__dirname + '/config/log4js.json');

const log = log4js.getLogger("app");

log.info("lib log init");
module.exports = log;