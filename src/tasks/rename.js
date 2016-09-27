const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Rename {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg, user_id, newNickname) {
    if (msg.from.id !== this.API.configs.admin) return;
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      {key: user_id.toUpperCase()})
    .then(({data}) => {
      const rows = data.rows;
      if (rows.length > 0) {
        const UserData = rows[0].value;
        const oldNickname = UserData.name;
        const newData = Object.assign(UserData, {
          _id: UserData._id,
          _rev: UserData._rev,
          name: newNickname
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          this.API.sendMessage({
            chat_id: UserData.tg_id,
            text: Util.format(local.your_nick_changed, [newNickname])
          });
          this.broadcastPlaneMessage.process(Util.format(local.new_user_nick, [oldNickname, newNickname]), UserData.tg_id);
        });
      } else {
        msg.sendMessage({
          text: local.user_not_found
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

  $checkUsername(name) {
    return new Promise((resolve, reject) => {
      this.DB.get(
        'anchat_users',
        '_design/anchat_users/_view/by_nick',
        {key: name})
      .then(({data}) => {
        resolve(!!data.rows.length);
      });
    });
  }
}

module.exports = Rename;