const Nickname = require('../nick');
const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

class Start {
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

      if (!rows.length) {
        const nickname = Nickname.generate(2);

        this.$createNewUser(msg, nickname)
        .then(({data}) => {
          msg.sendMessage({
            text: Util.format(local.start, [nickname]),
          });

          this.broadcastPlaneMessage.process(Util.format(local.new_user, [nickname]), msg.from.id);
        }, console.log);
      } else if (rows[0] && !rows[0].value.isChatUser) {
        const newData = Object.assign(rows[0].value, {
          _id: rows[0].id,
          _rev: rows[0].value._rev,
          isChatUser: true,
          lastMessage: Util.UTCTime()
        });
        
        this.DB.update(
          'anchat_users',
          newData)
        .then(({data}) => {
          msg.sendMessage({
            text: Util.format(local.start, [rows[0].value.name])
          });
          this.broadcastPlaneMessage.process(Util.format(local.entry_user, [rows[0].value.name]), msg.from.id);
        });
      } else if (rows[0] && rows[0].value.isChatUser) {
        msg.sendMessage({
          text: local.already_in_chat,
        });
      }
    })
  }

  $createNewUser(msg, nickname) {
    return this.DB.get('anchat_users', '_design/anchat_users/_view/count')
    .then(({data}) => {
      const length = (data.rows[0] && data.rows[0].value) || 0;
      const msgTime = Util.UTCTime();
      return this.DB.insert('anchat_users', {
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
      });
    });
  }

  $getUid() {
    const uid = this.DB.ids[0];
    this.DB.ids = this.DB.ids.slice(1);
    return uid;
  }
}

module.exports = Start;