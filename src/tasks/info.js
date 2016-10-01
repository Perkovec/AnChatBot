const local = require('../locals/ru.json');
const Util = require('../util');

class Info {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg, userId) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user.banned) {
        msg.sendMessage({
          text: local.you_are_banned,
        });
      } else if (user && user.isChatUser) {
        if (userId) {
          this.DB.$getUserByChatId(userId.toUpperCase().trim())
          .then((otherUser) => {
            if (otherUser) {
              this.$makeInfo(msg, otherUser);
            } else {
              msg.sendMessage({
                text: local.user_not_found,
              });
            }
          });
        } else {
          this.$makeInfo(msg, user);
        }
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
    
  }

  $makeInfo(msg, user) {
    const lastMsgDiff = Util.UTCTime() - user.lastMessage; // eslint-disable-line new-cap
    const nickname = user.name;
    const since = Util.timeDiff(Util.UTCTime() - user.startDate); // eslint-disable-line new-cap
    const lastOnline = Util.timeDiff(lastMsgDiff);

    const template = lastMsgDiff < 3 * 60 ? local.infoOnline : local.info;

    msg.sendMessage({
      text: Util.format(template, [nickname, since, lastOnline]),
    });

    this.DB.$updateUserLastMessage(msg.from.id);
  }
}

module.exports = Info;
