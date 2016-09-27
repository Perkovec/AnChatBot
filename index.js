const winston = require('winston');
const path = require('path');
const NodeCouchDb = require('node-couchdb');
const TgAPI = require('./src/api/API');
const config = require('./config.json');
const MsgProcessor = require('./src/msgprocessor');

const DailyRotateFile = require('winston-daily-rotate-file');

winston.add(DailyRotateFile, {
  filename: path.join(__dirname, '/logs'),
  datePattern: '-yyyy-MM-dd.log'
});

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (DailyRotateFile)({ filename: path.join(__dirname, '/logs/debug'), datePattern: '-yyyy-MM-dd.log' }),
  ],
});

config.rootDir = __dirname;
config.logger = logger;

const API = new TgAPI(config);

let DBConfig;
if (config.couchdb.username && config.couchdb.password) {
  DBConfig = {
    auth: {
      user: config.couchdb.username,
      pass: config.couchdb.password
    }
  }
} else {
  DBConfig = {};
}

const couch = new NodeCouchDb(DBConfig);

couch.uniqid(1000).then(ids => {
  couch.ids = ids;
  const OnMsg = new MsgProcessor(API, couch);

  API.onMessage(msg => OnMsg.process(msg));
  API.onError((msg, err) => OnMsg.processError(msg, err));
  API.run();
});