const Nickname = require('./nick');
const Util = require('./util');
const local = require('./locals/ru.json');
const CRegex = {
  start: /^(\/start)$/i
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
    } else {
      this.broadcastMessage(msg);
    }
  }

  broadcastMessage(msg) {
    
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
            _id: this.DB.ids[0],
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
            this.DB.ids = this.DB.ids.slice(1);
            msg.sendMessage({
              text: Util.format(local.start, [nickname]),
            });
          }, console.log);
        })
      } else {
        msg.sendMessage({
          text: local.already_in_chat,
        });
      }
    })
  }
}

module.exports = MsgProcessor;
