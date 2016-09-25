const Nickname = require('./nick');
const Util = require('./util');
const local = require('./locals/ru.json');
const CRegex = {
  start: /^(\/start)$/i,
  stop: /^(\/stop)$/i,
  list: /^(\/list)$/i,
  nick: /^(\/nick\s)(.*)/i // 1 group = "/nick ", 2 group = nickname
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
    } else if (CRegex.list.test(text)) {
      this.$list(msg);
    } else if (CRegex.nick.test(text)) {
      this.$nick(msg, text.match(CRegex.nick)[2]);
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
    this.$checkUserInChat(msg.from.id)
    .then(({isChatUser, UserData}) => {
      if (isChatUser) {
        const nickname = UserData.name;
        let text = `${nickname}: ${msg.text}`;
        if (msg.reply_to_message !== null) {
          const reply = msg.reply_to_message;
          let reply_msg;
          if (reply.id === msg.from.id) {
            reply_msg = `${nickname}: ${reply.text}`;
          } else {
            reply.text = reply.text.startsWith('В ответ на:') ? Util.cutLines(reply.text, 3) : reply.text;
            reply_msg = reply.text;
          }

          reply_msg = Util.truncate(reply_msg, 25).replace(/\n/g, ' ');
          text = Util.format(local.reply_to, [reply_msg, text]);
        }
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
          this.$updateUserLastMessage(msg.from.id);
        });
      } else {
        msg.sendMessage({
          text: local.not_in_chat
        });
      }
    });
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
          const msgTime = Util.UTCTime();
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
          isChatUser: true,
          lastMessage: Utils.UTCTime()
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
          msg.sendMessage({
            text: local.stop
          });
          this.broadcastPlaneMessage(Util.format(local.leave_chat, [rows[0].value.name]), msg.from.id);
        });
      }
    });
  }

  $list(msg) {
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

  $nick(msg, newNickname) {
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
          this.broadcastPlaneMessage(Util.format(local.new_user_nick, [oldNickname, newNickname]), msg.from.id);
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

  $getUid() {
    const uid = this.DB.ids[0];
    this.DB.ids = this.DB.ids.slice(1);
    return uid;
  }
}

module.exports = MsgProcessor;
