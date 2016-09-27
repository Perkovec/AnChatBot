const Nickname = require('./nick');
const Util = require('./util');
const local = require('./locals/ru.json');

const Start = require('./tasks/start.js');
const Stop = require('./tasks/stop.js');
const List = require('./tasks/list.js');
const Nick = require('./tasks/nick.js');
const Help = require('./tasks/help.js');
const BroadcastMessage = require('./tasks/broadcastMessage');
const BroadcastPlaneMessage = require('./tasks/broadcastPlaneMessage');

const CRegex = {
  start: /^(\/start)$/i,
  stop: /^(\/stop)$/i,
  help: /^(\/help)$/i,
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

    this.$start = new Start(this.API, this.DB);
    this.$stop = new Stop(this.API, this.DB);
    this.$list = new List(this.API, this.DB);
    this.$nick = new Nick(this.API, this.DB);
    this.$help = new Help(this.API, this.DB);
    this.broadcastMessage = new BroadcastMessage(this.API, this.DB);
    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg) {
    const text = msg.text;
    
    if (CRegex.start.test(text)) {
      this.$start.process(msg);
    } else if (CRegex.stop.test(text)) {
      this.$stop.process(msg);
    } else if (CRegex.list.test(text)) {
      this.$list.process(msg);
    } else if (CRegex.nick.test(text)) {
      this.$nick.process(msg, text.match(CRegex.nick)[2]);
    } else if (CRegex.help.test(text)) {
      this.$help.process(msg);
    } else {
      this.broadcastMessage.process(msg);
    }
  }

  processError(msg, err) {
    switch(err.error_code) {
      case 403:
        this.DB.get(
          'anchat_users',
          '_design/anchat_users/_view/by_tgid',
          {key: msg.chat_id})
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
              this.broadcastPlaneMessage.process(Util.format(local.leave_chat_with_ban, [rows[0].value.name]), msg.chat_id);
            });
          }
        });
      break;
    }
  }
}

module.exports = MsgProcessor;
