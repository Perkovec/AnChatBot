const Nickname = require('../nick');
const Util = require('../util');
const local = require('../locals/ru.json');

const BroadcastPlaneMessage = require('./broadcastPlaneMessage');

const userGroups = {
  NEWBIE: 0,
  USER: 1,
  ADMIN: 100,
};

class Start {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then(user => {
      if (!user) {
        const nickname = Nickname.generate(2);

        this.$createNewUser(msg, nickname)
        .then(() => {
          msg.sendMessage({
            text: Util.format(local.start_new, [nickname]),
          });

          this.broadcastPlaneMessage.process(Util.format(local.new_user, [nickname]), msg.from.id);
        });
      } else if (!user.isChatUser) {
        this.DB.$updateDocumentFields(user, {
          isChatUser: true,
          lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
        })
        .then(() => {
          msg.sendMessage({
            text: Util.format(local.start, [user.name]),
          })
          .then(response => {
            this.broadcastPlaneMessage.process(
              Util.format(local.entry_user, [user.name]),
              msg.from.id,
              null,
              { id: msg.from.id, message_id: response.message_id }
            );
          });
        });
      } else {
        msg.sendMessage({
          text: local.already_in_chat,
        });
      }
    })
  }

  $createNewUser(msg, nickname) {
    return this.DB.get('anchat_users', '_design/anchat_users/_view/count')
    .then(({ data }) => {
      const length = (data.rows[0] && data.rows[0].value) || 0;
      const msgTime = Util.UTCTime(); // eslint-disable-line new-cap
      return this.DB.insert('anchat_users', {
        _id: this.$getUid(),
        tg_id: msg.from.id,
        id: Util.numberToLetter(length + 1),
        name: nickname,
        startDate: msgTime,
        banned: false,
        muted: false,
        muteEndTime: 0,
        isChatUser: true,
        lastMessage: msgTime,
        userGroup: userGroups.NEWBIE,
        privateMsgs: '',
        hidden: false,
      });
    });
  }

  $getUid() {
    if (this.DB.ids.length <= 20) {
      this.DB.uniqid(1000).then((ids) => {
        this.DB.ids = ids;
      });
    }
    const uid = this.DB.ids[0];
    this.DB.ids = this.DB.ids.slice(1);
    return uid;
  }
}

module.exports = Start;
