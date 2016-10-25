const Util = require('../util');
const local = require('../locals/ru.json');
const clean = require('../../clear_db');

class Clean {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg, userId) {
    if (msg.from.id !== this.API.configs.admin) return;
    clean(() => {
      msg.sendMessage({
        text: "Cleaned",
      });
    });
  }
}

module.exports = Clean;