const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Unban {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, userId) {
    if (msg.from.id !== this.API.configs.admin) return;
    this.DB.$getUserByChatId(userId)
    .then((user) => {
      if (user) {
        this.DB.$updateDocumentFields(user, {
          banned: false,
          isChatUser: true,
        })
        .then(() => {
          this.API.sendMessage({
            chat_id: user.tg_id,
            text: local.user_unbanned,
          }).then((response) => {
            this.broadcastPlaneMessage.process(
              Util.format(local.user_unbanned_public, [user.name]),
              user.tg_id,
              null,
              { id: msg.from.id, message_id: response.message_id }
            );
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

module.exports = Unban;
