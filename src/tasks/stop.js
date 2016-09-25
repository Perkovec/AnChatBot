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
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      {key: msg.from.id})
    .then(({data}) => {
      const rows = data.rows;
      if (rows.length && rows[0].value.isChatUser) {
        const newData = Object.assign(rows[0].value, {
          _id: rows[0].id,
          _rev: rows[0].value._rev,
          isChatUser: false
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          msg.sendMessage({
            text: local.stop
          });
          this.broadcastPlaneMessage.process(Util.format(local.leave_chat, [rows[0].value.name]), msg.from.id);
        });
      }
    });
  }
}

module.exports = Stop;