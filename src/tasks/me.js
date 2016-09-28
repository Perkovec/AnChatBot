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
    this.$checkUserInChat(msg.from.id)
    .then(({ isChatUser, UserData }) => {
      if (isChatUser) {
        this.broadcastPlaneMessage.process(
          Util.format(local.me, [UserData.name, Util.escapeHtml(text)]),
          msg.from.id,
          'HTML'
        );
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }

  $checkUserInChat(id) {
    return new Promise((resolve, reject) => {
      this.DB.get(
        'anchat_users',
        '_design/anchat_users/_view/by_tgid',
        { key: id })
      .then(({ data }) => {
        const rows = data.rows;
        if (!rows.length || !rows[0].value.isChatUser) {
          resolve({ isChatUser: false });
        } else {
          resolve({ isChatUser: true, UserData: rows[0].value });
        }
      }, reject);
    });
  }
}

module.exports = Me;