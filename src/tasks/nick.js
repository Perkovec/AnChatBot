const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Nick {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, newNickname) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user && user.isChatUser) {
        const nick = newNickname.trim();
        if (nick.length < 1) {
          msg.sendMessage({
            text: local.short_nickname,
          });
        } else {
          this.DB.$getUserByNickname(nick)
          .then((contains) => {
            if (!contains) {
              const oldNickname = user.name;
              this.DB.$updateDocumentFields(user, {
                name: nick,
                lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
              })
              .then(() => {
                msg.sendMessage({
                  text: Util.format(local.new_nick, [nick]),
                }).then((response) => {
                  this.broadcastPlaneMessage.process(
                    Util.format(local.new_user_nick, [oldNickname, nick]),
                    msg.from.id,
                    null,
                    { id: msg.from.id, message_id: response.message_id }
                  );
                });
              });
            } else {
              msg.sendMessage({
                text: local.nickname_exists,
              });
            }
          });
        }
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }
}

module.exports = Nick;
