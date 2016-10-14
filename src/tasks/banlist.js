const Util = require('../util');
const local = require('../locals/ru.json');

class Banlist {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user.banned) {
        msg.sendMessage({
          text: local.you_are_banned,
        });
      } else if (user && user.isChatUser) {
        this.DB.$getBannedUsers()
        .then((users) => {
          let list = '';

          for (let i = 0; i < users.length; i += 1) {
            const usr = users[i];
            const diff = Util.UTCTime() - usr.lastMessage; // eslint-disable-line new-cap
            if (diff < 60 * 3) {
              list += Util.format(local.listItemOnline, [usr.id, usr.name]);
            } else {
              list += Util.format(local.listItem, [usr.id, usr.name, Util.timeDiff(diff)]);
            }
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

module.exports = Banlist;
