const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Kick {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, user_id) {
    if (msg.from.id !== this.API.configs.admin) return;
    console.log(user_id)
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      {key: user_id.toUpperCase()})
    .then(({data}) => {
      const rows = data.rows;
      if (rows.length && rows[0].value.isChatUser) {
        console.log(rows[0])
        const newData = Object.assign(rows[0].value, {
          _id: rows[0].id,
          _rev: rows[0].value._rev,
          isChatUser: false
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          this.API.sendMessage({
            chat_id: rows[0].value.tg_id,
            text: local.user_kicked
          });
          this.broadcastPlaneMessage.process(Util.format(local.user_kicked_public, [rows[0].value.name]), rows[0].value.tg_id);
        });
      }
    });
  }
}

module.exports = Kick;