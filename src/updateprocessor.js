const Util = require('./util');
const local = require('./locals/ru.json');
const fs = require('fs');
const path = require('path');

const CRegex = {
  some_command: /^\/\w*.*/i,
  me: /^(%)(.*)/i,
  me2: /^(\/me\s)(.*)/i,
};

const pluginsPath = path.join(__dirname, 'tasks');

class UpdateProcessor {
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
    let text = msg.text ? msg.text.trim() : msg.text;
    let caption = msg.caption ? msg.caption.trim() : msg.caption;

    if (text) {
      if (CRegex.me.test(text)) {
        const matches = text.match(CRegex.me);
        this.$me.getText(msg, matches[2].trim())
        .then((text) => {
          if (text) {
            this.$changeMessages(msg, text, msg.from.id);
          }
          return null
        });
      } else if (CRegex.me2.test(text)) {
        const matches = text.match(CRegex.me2);
        this.$me.getText(msg, matches[2].trim())
        .then((text) => {
          if (text) {
            this.$changeMessages(msg, text, msg.from.id);
          }
          return null
        });
      } else if (CRegex.some_command.test(text)) {
        msg.sendMessage({
          text: local.disable_command_edit,
        });
      } else {
        this.DB.$getUserByTgId(msg.from.id)
        .then((user) => {
          const msgText = `${user.name}: ${text}`;
          this.$changeMessages(msg, Util.escapeHtml(msgText), msg.from.id);
        });
      } 
    } else if (caption) {
      this.DB.$getUserByTgId(msg.from.id)
      .then((user) => {
        const msgText = `${user.name}: ${caption}`;
        this.$changeMessages(msg, Util.escapeHtml(msgText), msg.from.id, true);
      });
    }
  }

  $changeMessages(msg, newText, exclude, caption) {
    this.DB.$getRepliesById(msg.message_id)
    .then((replies) => {
      if (replies) {
        return this.DB.$getChatUsers()
        .then((users) => {
          if (users) {
            users.sort((a, b) => {
              const x = a.lastMessage;
              const y = b.lastMessage;
              if (x < y) {
                return 1;
              } else if (x > y) {
                return -1;
              }
              return 0;
            });

            for (let i = 0; i < users.length; i += 1) {
              if (users[i].tg_id !== exclude) {
                const reply = replies[`user_${users[i].tg_id}`];

                if (caption) {
                  this.API.editMessageCaption({
                    chat_id: users[i].tg_id,
                    message_id: reply,
                    caption: newText,
                  });
                } else {
                  this.API.editMessageText({
                    chat_id: users[i].tg_id,
                    message_id: reply,
                    text: newText,
                    parse_mode: 'HTML',
                  });
                }        
              }
            }
          }
        });
      }
      return null
    });
  }
}

module.exports = UpdateProcessor;
