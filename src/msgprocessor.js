const Nickname = require('./nick');
const Util = require('./util');
const local = require('./locals/ru.json');
const CRegex = {
  start: /^(\/start)$/i,
  stop: /^(\/stop)$/i
};

const userGroups = {
  NEWBIE: 0,
  USER: 1,
  ADMIN: 100,
};

class MsgProcessor {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    const text = msg.text;
    
    if (CRegex.start.test(text)) {
      this.$start(msg);
    } else if (CRegex.stop.test(text)) {
      this.$stop(msg);
    } else {
      this.broadcastMessage(msg);
    }
  }

  broadcastPlaneMessage(text, exclude_id) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== exclude_id) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text: text
          });
        }
      }
    });
  }

  broadcastMessage(msg) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      {key: msg.from.id})
    .then(({data}) => {
      const rows = data.rows;
      if (!rows.length || !rows[0].value.isChatUser) {
        msg.sendMessage({
          text: local.not_in_chat
        });
      } else {
        const nickname = rows[0].value.name;
        const text = `${nickname}: ${msg.text}`;
        this.DB.get(
          'anchat_users',
          '_design/anchat_users/_view/by_isChatUser')
        .then(({data}) => {
          const rows = data.rows;
          for (let i = 0; i < rows.length; ++i) {
            if (rows[i].key !== msg.from.id) {
              this.API.sendMessage({
                chat_id: rows[i].key,
                text: text
              });
            }
          }
        });
      }
    })
  }

  $start(msg) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      {key: msg.from.id})
    .then(({data}) => {
      const rows = data.rows;
      if (!rows.length) {
        this.DB.get('anchat_users', '_design/anchat_users/_view/count')
        .then(({data}) => {
          const nickname = Nickname.generate(2);
          const length = (data.rows[0] && data.rows[0].value) || 0;
          const msgTime = Math.floor(Date.now() / 1000);
          this.DB.insert('anchat_users', {
            _id: this.$getUid(),
            tg_id: msg.from.id,
            id: Util.numberToLetter(length + 1),
            name: nickname,
            achieves: '',
            startDate: msgTime,
            banned: false,
            muted: false,
            muteEndTime: 0,
            isChatUser: true,
            lastMessage: msgTime,
            userGroup: userGroups.NEWBIE,
            privateMsgs: '',
            hidden: false
          })
          .then(({data}) => {
            msg.sendMessage({
              text: Util.format(local.start, [nickname]),
            });
            this.broadcastPlaneMessage(Util.format(local.new_user, [nickname]), msg.from.id);
          }, console.log);
        })
      } else if (rows[0] && !rows[0].value.isChatUser) {
        const newData = Object.assign(rows[0].value, {
          _id: rows[0].id,
          _rev: rows[0].value._rev,
          isChatUser: true
        });
        
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          msg.sendMessage({
            text: Util.format(local.start, [rows[0].value.name])
          });
          this.broadcastPlaneMessage(Util.format(local.entry_user, [rows[0].value.name]), msg.from.id);
        });
      } else if (rows[0] && rows[0].value.isChatUser) {
        msg.sendMessage({
          text: local.already_in_chat,
        });
      }
    })
  }

  $stop(msg) {
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
          console.log(data)
          msg.sendMessage({
            text: local.stop
          });
          this.broadcastPlaneMessage(Util.format(local.leave_chat, [rows[0].value.name]), msg.from.id);
        });
      }
    });
  }

  $getUid() {
    const uid = this.DB.ids[0];
    this.DB.ids = this.DB.ids.slice(1);
    return uid;
  }
}

module.exports = MsgProcessor;
