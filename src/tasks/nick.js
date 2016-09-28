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
    this.$checkUserInChat(msg.from.id)
    .then(({ isChatUser, UserData }) => {
      if (isChatUser) {
        if (newNickname.length < 1) {
          return msg.sendMessage({
            text: local.short_nickname,
          });
        }
        this.$checkUsername(newNickname)
        .then((contains) => {
          if (contains) {
            msg.sendMessage({
              text: local.nickname_exists,
            });
          } else {
            const oldNickname = UserData.name;
            const newData = Object.assign(UserData, {
              _id: UserData._id, // eslint-disable-line no-underscore-dangle
              _rev: UserData._rev, // eslint-disable-line no-underscore-dangle
              lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
              name: newNickname,
            });
            this.DB.update(
              'anchat_users',
              newData)
            .then(() => {
              msg.sendMessage({
                text: Util.format(local.new_nick, [newNickname]),
              });
              this.broadcastPlaneMessage.process(
                Util.format(local.new_user_nick, [oldNickname, newNickname]),
                msg.from.id
              );
            });
          }
        });
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
      return null;
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

module.exports = Nick;
