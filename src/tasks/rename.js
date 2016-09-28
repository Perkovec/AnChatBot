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
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      { key: userid.toUpperCase() })
    .then(({ data }) => {
      const rows = data.rows;
      if (rows.length > 0) {
        const UserData = rows[0].value;
        const oldNickname = UserData.name;
        const newData = Object.assign(UserData, {
          _id: UserData._id, // eslint-disable-line no-underscore-dangle
          _rev: UserData._rev, // eslint-disable-line no-underscore-dangle
          name: newNickname,
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(() => {
          this.API.sendMessage({
            chat_id: UserData.tg_id,
            text: Util.format(local.your_nick_changed, [newNickname]),
          });
          this.broadcastPlaneMessage.process(
            Util.format(local.new_user_nick, [oldNickname, newNickname]),
            UserData.tg_id
          );
        });
      } else {
        msg.sendMessage({
          text: local.user_not_found,
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

  $updateUserLastMessage(id) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      { key: id })
    .then(({ data }) => {
      const rows = data.rows;
      const newData = Object.assign(rows[0].value, {
        _id: rows[0].id,
        _rev: rows[0].value._rev, // eslint-disable-line no-underscore-dangle
        lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
      });
      this.DB.update('anchat_users', newData);
    });
  }

  $checkUsername(name) {
    return new Promise((resolve, reject) => {
      this.DB.get(
        'anchat_users',
        '_design/anchat_users/_view/by_nick',
        { key: name })
      .then(({ data }) => {
        resolve(!!data.rows.length);
      }, reject);
    });
  }
}

module.exports = Rename;
