const local = require('../locals/ru.json');
const Util = require('../util');

class Info {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg, userId) {
    if (userId) {
      this.DB.$getUserByChatId(userId.toUpperCase().trim())
      .then((user) => {
        if (user) {
          this.$makeInfo(msg, user)
        } else {
          msg.sendMessage({
            text: local.user_not_found,
          })
        }
      });
    } else {
      this.DB.$getUserByTgId(msg.from.id)
      .then((user) => {
        if (user) {
          this.$makeInfo(msg, user)
        } else {
          msg.sendMessage({
            text: local.user_not_found,
          })
        }
      });
    }
  }

  $makeInfo(msg, user) {
    const nickname = user.name;
    const since = Util.timeDiff(Util.UTCTime() - user.startDate);
    const lastOnline = Util.timeDiff(Util.UTCTime() - user.lastMessage);

    const template = Util.UTCTime() - user.lastMessage < 3 * 60 ? local.infoOnline : local.info;

    msg.sendMessage({
      text: Util.format(template, [nickname, since, lastOnline])
    });
  }
}

module.exports = Info;
