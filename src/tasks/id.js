const Util = require('../util');
const local = require('../locals/ru.json');

class Id {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg, userid, newId) {
    if (msg.from.id !== this.API.configs.admin) return;
    this.DB.$getUserByChatId(userid)
    .then((user) => {
      if (user) {
        this.DB.$updateDocumentFields(user, {
          id: newId.toUpperCase(),
        })
        .then(() => {
          msg.sendMessage({
            text: Util.format(local.id_updated, [user.name]),
          });
        });
      } else {
        msg.sendMessage({
          text: local.user_not_found,
        });
      }
    });
  }
}

module.exports = Id;
