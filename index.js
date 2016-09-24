const winston = require('winston');
const TarantoolConnection = require('./src/tarantool/connection');
const TgAPI = require('./src/api/API');
const config = require('./config.json');
const MsgProcessor = require('./src/msgprocessor');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'logs/debug.log', json: false }),
  ],
});

config.rootDir = __dirname;
config.logger = logger;

const API = new TgAPI(config);


const DBConnect = new TarantoolConnection({port: 3301});
DBConnect.connect()
.then(() => {
  console.log('connected');
  
  return DBConnect.auth(config.tarantool_username, config.tarantool_password);
})
.then(() => {
  console.log('authed');
  const OnMsg = new MsgProcessor(API, DBConnect);

  API.onMessage(msg => OnMsg.process(msg));
  API.startPolling();
});