const Util = require('../util');
const local = require('../locals/ru.json');

class List {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user) {
        this.DB.$getChatUsers()
        .then((users) => {
          let list = '';
          users.sort((a, b) => {
            const x = a.lastMessage;
            const y = b.lastMessage;
            if (x < y) {
              return 1;
            } else if (x > y) {
              return -1;
            }

            return 0;
          });

          for (let i = 0; i < users.length; i += 1) {
            const usr = users[i];
            list += `#${usr.id} '${usr.name}' ${Util.timeDiff2Text(Util.UTCTime() - usr.lastMessage)}\n`; // eslint-disable-line new-cap
          }

          msg.sendMessage({
            text: Util.format(local.list, [list]),
          });

          this.DB.$updateUserLastMessage(msg.from.id);
        });
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }
}

module.exports = List;
