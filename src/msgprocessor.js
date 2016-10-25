const Util = require('./util');
const local = require('./locals/ru.json');
const fs = require('fs');
const path = require('path');

const CRegex = {
  some_command: /^\/\w*.*/i,
  start: /^(\/start)$/i,
  stop: /^(\/stop)$/i,
  help: /^(\/help)$/i,
  list: /^(\/list)$/i,
  banlist: /^(\/banlist)$/i,
  nick: /^(\/nick\s)(.*)/i, // 1 group = "/nick ", 2 group = nickname
  kick: /^(\/kick\s)(.*)/i, // 1 group = "/kick ", 2 group = chat_id
  ban: /^(\/ban\s)(.*)/i, // 1 group = "/ban ", 2 group = chat_id
  unban: /^(\/unban\s)(.*)/i, // 1 group = "/unban ", 2 group = chat_id
  rename: /^(\/rename)\s(\w*)\s(.*)/i, // 1 group = "/rename ", 2 group = chat_id, 3 group = nick
  id: /^(\/id)\s(\w*)\s(\w*)/i, // 1 group = "/id ", 2 group = chat_id, 3 group = new chat_id
  me: /^(%)(.*)/i, // 1 group = "%", 2 group = text
  me2: /^(\/me\s)(.*)/i,
  info: /^(\/info)(\s(\w*))?/i, // 1 group = "/info", 2 group = chat_id || undefined
  clean: /^(\/clean)$/i,
};

const pluginsPath = path.join(__dirname, 'tasks');

class MsgProcessor {
  constructor(api, db) {
    this.API = api;
    this.DB = db;

    this.loadPlugins();
  }

  loadPlugins() {
    const fileList = fs.readdirSync(pluginsPath);
    for (let i = 0; i < fileList.length; i += 1) {
      const file = fileList[i];
      const Plugin = require(path.join(pluginsPath, file)); // eslint-disable-line global-require
      this[`$${path.basename(file, '.js')}`] = new Plugin(this.API, this.DB);
    }
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
    } else if (CRegex.me.test(text)) {
      const matches = text.match(CRegex.me);
      this.$me.process(msg, matches[2].trim());
    } else if (CRegex.me2.test(text)) {
      const matches = text.match(CRegex.me2);
      this.$me.process(msg, matches[2].trim());
    } else if (CRegex.info.test(text)) {
      this.$info.process(msg, text.match(CRegex.info)[2]);
    } else if (CRegex.ban.test(text)) {
      this.$ban.process(msg, text.match(CRegex.ban)[2]);
    } else if (CRegex.unban.test(text)) {
      this.$unban.process(msg, text.match(CRegex.unban)[2]);
    } else if (CRegex.banlist.test(text)) {
      this.$banlist.process(msg);
    } else if (CRegex.clean.test(text)) {
      this.$clean.process(msg);
    } else if (CRegex.some_command.test(text)) {
      msg.sendMessage({
        text: local.unknown_command,
      });
    } else {
      this.$broadcastMessage.process(msg);
    }
  }

  processReqError(msg, err) {
    if (!err.response) return;
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
              this.$broadcastPlaneMessage.process(
                Util.format(local.leave_chat_with_ban, [rows[0].value.name]),
                msg.chat_id
              );
            });
          }
        });
        break;
      default:
        this.API.logger.warn(err.response.status);
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
              this.$broadcastPlaneMessage.process(
                Util.format(local.leave_chat_with_ban, [rows[0].value.name]),
                msg.chat_id
              );
            });
          }
        });
        break;
      default:
        this.API.logger.error(err);
    }
    return null;
  }
}

module.exports = MsgProcessor;
