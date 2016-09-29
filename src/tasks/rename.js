const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Rename {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, userid, newNickname) {
    if (msg.from.id !== this.API.configs.admin) return;
    this.DB.$getUserByChatId(userid)
    .then(user => {
      if (user) {
        const oldNickname = user.name;
        this.DB.$updateDocumentFields(user, {
          name: newNickname,
        })
        .then(() => {
          this.API.sendMessage({
            chat_id: user.tg_id,
            text: Util.format(local.your_nick_changed, [newNickname]),
          });
          this.broadcastPlaneMessage.process(
            Util.format(local.new_user_nick, [oldNickname, newNickname]),
            user.tg_id
          );
        });
      } else {
        msg.sendMessage({
          text: local.user_not_found,
        });
      }
    });
  }
}

module.exports = Rename;
