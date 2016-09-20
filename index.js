const winston = require('winston');
const TgAPI = require('./src/api/API');
const config = require('./config.json');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'logs/debug.log', json: false })
  ]
});

config.rootDir = __dirname;
config.logger = logger;

const API = new TgAPI(config);

API.onMessage(msg => {
  console.log(msg.text);
});

API.startPolling();