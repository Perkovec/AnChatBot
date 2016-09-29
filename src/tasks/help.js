const Util = require('../util');
const local = require('../locals/ru.json');

class List {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then(user => {
      if (user) {
        msg.sendMessage({
          text: local.help,
        });
        this.DB.$updateUserLastMessage(msg.from.id);
      }
    });
  }
}

module.exports = List;
