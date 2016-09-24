const winston = require('winston');
const NodeCouchDb = require('node-couchdb');
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

const couch = new NodeCouchDb();

couch.uniqid(1000).then(ids => {
  couch.ids = ids;
  const OnMsg = new MsgProcessor(API, couch);

  API.onMessage(msg => OnMsg.process(msg));
  API.startPolling();
});