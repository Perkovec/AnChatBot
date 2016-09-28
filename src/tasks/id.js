const Util = require('../util');
const local = require('../locals/ru.json');

class Id {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg, userid, newId) {
    if (msg.from.id !== this.API.configs.admin) return;
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      { key: userid.toUpperCase() })
    .then(({ data }) => {
      const rows = data.rows;
      if (rows.length > 0) {
        const UserData = rows[0].value;
        const newData = Object.assign(UserData, {
          _id: UserData._id, // eslint-disable-line no-underscore-dangle
          _rev: UserData._rev, // eslint-disable-line no-underscore-dangle
          id: newId.toUpperCase(),
        });
        this.DB.update(
          'anchat_users',
          newData)
        .then(() => {
          msg.sendMessage({
            text: Util.format(local.id_updated, [UserData.name]),
          });
        });
      } else {
        msg.sendMessage({
          text: local.user_not_found,
        });
      }
    });
  }
}

module.exports = Id;
