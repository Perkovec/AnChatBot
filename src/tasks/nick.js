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
    if (newNickname.length < 1) {
      return msg.sendMessage({
        text: local.short_nickname
      });
    }
    this.$checkUserInChat(msg.from.id)
    .then(({isChatUser, UserData}) => {
      if (isChatUser) {
        const oldNickname = UserData.name;
        const newData = Object.assign(UserData, {
          _id: UserData._id,
          _rev: UserData._rev,
          lastMessage: Util.UTCTime(),
          name: newNickname
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          msg.sendMessage({
            text: Util.format(local.new_nick, [newNickname])
          });
          this.broadcastPlaneMessage.process(Util.format(local.new_user_nick, [oldNickname, newNickname]), msg.from.id);
        });
      } else {
        msg.sendMessage({
          text: local.not_in_chat
        });
      }
    });
  }

  $checkUserInChat(id) {
    return new Promise((resolve, reject) => {
      this.DB.get(
        'anchat_users',
        '_design/anchat_users/_view/by_tgid',
        {key: id})
      .then(({data}) => {
        const rows = data.rows;
        if (!rows.length || !rows[0].value.isChatUser) {
          resolve({isChatUser: false});
        } else {
          resolve({isChatUser: true, UserData: rows[0].value});
        }
      }, reject)
    });
  }

  $updateUserLastMessage(id) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      {key: id})
    .then(({data}) => {
      const rows = data.rows;
      const newData = Object.assign(rows[0].value, {
        _id: rows[0].id,
        _rev: rows[0].value._rev,
        lastMessage: Util.UTCTime()
      });
      this.DB.update('anchat_users', newData);
    });
  }
}

module.exports = Nick;