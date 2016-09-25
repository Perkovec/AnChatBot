const Util = require('../util');
const local = require('../locals/ru.json');

class List {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.$checkUserInChat(msg.from.id)
    .then(({isChatUser}) => {
      if (isChatUser) {
        this.DB.get(
          'anchat_users',
          '_design/anchat_users/_view/by_isChatUser')
        .then(({data}) => {
          let list = '';
          const rows = data.rows;

          rows.sort((a, b) => {
            let x = a.value.lastMessage; let y = b.value.lastMessage;
            return ((x < y) ? 1 : ((x > y) ? -1 : 0));
          });

          for (let i = 0; i < rows.length; ++i) {
            const user = rows[i].value;
            list += `#${user.id} '${user.name}' ${Util.timeDiff2Text(Util.UTCTime() - user.lastMessage)}\n`;
          }

          msg.sendMessage({
            text: Util.format(local.list, [list])
          });
          this.$updateUserLastMessage(msg.from.id);
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

module.exports = List;
