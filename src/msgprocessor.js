const Util = require('./util');
const local = require('./locals/ru.json');

const Start = require('./tasks/start');
const Stop = require('./tasks/stop');
const List = require('./tasks/list');
const Nick = require('./tasks/nick');
const Help = require('./tasks/help');
const Kick = require('./tasks/kick');
const Rename = require('./tasks/rename');
const Id = require('./tasks/id');
const BroadcastMessage = require('./tasks/broadcastMessage');
const BroadcastPlaneMessage = require('./tasks/broadcastPlaneMessage');

const CRegex = {
  some_command: /^\/\w*.*/i,
  start: /^(\/start)$/i,
  stop: /^(\/stop)$/i,
  help: /^(\/help)$/i,
  list: /^(\/list)$/i,
  nick: /^(\/nick\s)(.*)/i, // 1 group = "/nick ", 2 group = nickname
  kick: /^(\/kick\s)(.*)/i, // 1 group = "/kick ", 2 group = chat_id
  rename: /^(\/rename)\s(\w*)\s(.*)/i, // 1 group = "/rename ", 2 group = chat_id, 3 group = nick
  id: /^(\/id)\s(\w*)\s(\w*)/i, // 1 group = "/id ", 2 group = chat_id, 3 group = new chat_id
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
    this.$kick = new Kick(this.API, this.DB);
    this.$rename = new Rename(this.API, this.DB);
    this.$id = new Id(this.API, this.DB);
    this.broadcastMessage = new BroadcastMessage(this.API, this.DB);
    this.broadcastPlaneMessage = new BroadcastPlaneMessage(this.API, this.DB);
  }

  process(msg) {
    const text = msg.text ? msg.text.trim() : msg.text;

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
    } else if (CRegex.kick.test(text)) {
      this.$kick.process(msg, text.match(CRegex.kick)[2]);
    } else if (CRegex.rename.test(text)) {
      const matches = text.match(CRegex.rename);
      this.$rename.process(msg, matches[2], matches[3]);
    } else if (CRegex.id.test(text)) {
      const matches = text.match(CRegex.id);
      this.$id.process(msg, matches[2], matches[3]);
    } else if (CRegex.some_command.test(text)) {
      msg.sendMessage({
        text: local.unknown_command,
      });
    } else {
      this.broadcastMessage.process(msg);
    }
  }

  processReqError(msg, err) {
    switch (err.response.status) {
      case 403:
        this.DB.get(
          'anchat_users',
          '_design/anchat_users/_view/by_tgid',
          { key: msg.chat_id })
        .then(({ data }) => {
          const rows = data.rows;
          if (rows.length && rows[0].value.isChatUser) {
            const newData = Object.assign(rows[0].value, {
              _id: rows[0].id,
              _rev: rows[0].value._rev, // eslint-disable-line no-underscore-dangle
              isChatUser: false,
            });
            this.DB.update(
              'anchat_users',
              newData)
            .then(() => {
              this.broadcastPlaneMessage.process(
                Util.format(local.leave_chat_with_ban, [rows[0].value.name]),
                msg.chat_id
              );
            });
          }
        });
        break;
    }
  }

  processError(msg, err) {
    switch (err.error_code) {
      case 403:
        this.DB.get(
          'anchat_users',
          '_design/anchat_users/_view/by_tgid',
          { key: msg.chat_id })
        .then(({ data }) => {
          const rows = data.rows;
          if (rows.length && rows[0].value.isChatUser) {
            const newData = Object.assign(rows[0].value, {
              _id: rows[0].id,
              _rev: rows[0].value._rev, // eslint-disable-line no-underscore-dangle
              isChatUser: false,
            });
            this.DB.update(
              'anchat_users',
              newData)
            .then(() => {
              this.broadcastPlaneMessage.process(
                Util.format(local.leave_chat_with_ban, [rows[0].value.name]),
                msg.chat_id
              );
            });
          }
        });
        break;
      default:
        return null;
    }
    return null;
  }
}

module.exports = MsgProcessor;
