const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Stop {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then(user => {
      if (user) {
        this.DB.$updateDocumentFields(user, {
          isChatUser: false,
        })
        .then(() => {
          msg.sendMessage({
            text: local.stop,
          })
          .then(response => {
            this.broadcastPlaneMessage.process(
              Util.format(local.leave_chat, [user.name]),
              msg.from.id,
              null,
              { id: msg.from.id, message_id: response.message_id }
            );
          });
        });
      }
    });
  }
}

module.exports = Stop;
