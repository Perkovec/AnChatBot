const local = require('../locals/ru.json');

class List {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user && user.isChatUser) {
        msg.sendMessage({
          text: local.help,
        });
        this.DB.$updateUserLastMessage(msg.from.id);
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }
}

module.exports = List;
