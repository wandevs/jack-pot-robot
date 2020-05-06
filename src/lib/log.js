const log4js = require('log4js');
const config = require('../../config/log4js.js');
log4js.configure(config);

const log = log4js.getLogger("app");

log.info("lib log init");
module.exports = log;
