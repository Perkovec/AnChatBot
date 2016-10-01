const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Me {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, text) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user && user.isChatUser) {
        this.broadcastPlaneMessage.process(
          Util.format(local.me, [user.name, Util.escapeHtml(text)]),
          msg.from.id,
          'HTML',
          { id: msg.from.id, message_id: msg.message_id }
        );
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }

  getText(msg, text) {
    return this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user) {
        return Util.format(local.me, [user.name, Util.escapeHtml(text)]);
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
      return null;
    });
  }
}

module.exports = Me;
