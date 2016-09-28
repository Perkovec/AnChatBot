const forever = require('forever-monitor');
const config = require('./config.json');
const local = require('./src/locals/ru.json');
const TgAPI = require('./src/api/API');

const API = new TgAPI(config);

const child = new (forever.Monitor)('./index.js', {
  max: 100,
});

child.on('exit', () => {
  API.sendMessage({
    chat_id: config.admin,
    text: local.bot_was_stoped,
    parse_mode: 'HTML'
  });
});

child.on('restar', () => {
  API.sendMessage({
    chat_id: config.admin,
    text: local.bot_was_restarted,
    parse_mode: 'HTML'
  });
});

child.start();