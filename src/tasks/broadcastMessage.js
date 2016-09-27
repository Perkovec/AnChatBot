const url = require('url');
const linkify = require('linkifyjs');
const Util = require('../util');
const local = require('../locals/ru.json');

class BroadcastMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.$checkUserInChat(msg.from.id)
    .then(({isChatUser, UserData}) => {
      if (isChatUser) {
        if (msg.text) {
          this.$sendText(msg, UserData);
        } else if (msg.audio) {
          this.$sendAudio(msg, UserData);
        } else if (msg.photo) {
          this.$sendPhoto(msg, UserData);
        } else if (msg.document) {
          this.$sendDocument(msg, UserData);
        } else if (msg.sticker) {
          this.$sendSticker(msg, UserData);
        } else if (msg.video) {
          this.$sendVideo(msg, UserData);
        } else if (msg.voice) {
          this.$sendVoice(msg, UserData);
        }
      } else {
        msg.sendMessage({
          text: local.not_in_chat
        });
      }
    });
  }

  $sendVoice(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.voice_from_user);

    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendVoice({
            chat_id: rows[i].key,
            voice: msg.voice.file_id,
            caption: text
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendVideo(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.video_from_user);

    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendVideo({
            chat_id: rows[i].key,
            video: msg.video.file_id,
            caption: text
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendSticker(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.sticker_from_user);

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
          })
          .then(() => {
            this.API.sendSticker({
              chat_id: rows[i].key,
              sticker: msg.sticker.file_id
            });
          })
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendDocument(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.document_from_user);

    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendDocument({
            chat_id: rows[i].key,
            document: msg.document.file_id,
            caption: text
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendPhoto(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.photo_from_user);

    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      const photo_id = msg.photo[msg.photo.length - 1].file_id;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendPhoto({
            chat_id: rows[i].key,
            photo: photo_id,
            caption: text
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendAudio(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname, local.audio_from_user);

    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendAudio({
            chat_id: rows[i].key,
            audio: msg.audio.file_id,
            caption: text
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
    });
  }

  $sendText(msg, UserData) {
    const nickname = UserData.name;
    const text = this.$getTextToSend(msg, nickname);
    
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text: text,
            parse_mode: 'HTML'
          });
        }
      }
      this.$updateUserLastMessage(msg.from.id);
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

  $getTextToSend(msg, nickname, template) {
    let text;
    if (msg.caption || !template) {
      text = msg.caption ? msg.caption : this.$linkShortener(msg);
      text = `${nickname}: ${text}`;
    } else {
      text = Util.escapeHtml(Util.format(template, [nickname]));
    }
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${replyText}`;
      } else if (replyText) {
        replyText = replyText.startsWith('В ответ на:') ? Util.cutLines(replyText, 3) : replyText;
        reply_msg = replyText;
      }

      reply_msg = Util.truncate(reply_msg, 25).replace(/\n/g, ' ');
      text = Util.format(local.reply_to, [reply_msg, text]);
    }
    return text;
  }

  $linkShortener(msg) {
    if (!msg.entities) return msg.text;

    let new_text = Util.escapeHtml(msg.text);
    const links = linkify.find(msg.text, 'url');
    for (let i = 0; i < links.length; ++i) {
      const link = links[0];
      new_text = new_text.replace(Util.escapeHtml(link.value), `<a href="${link.href}">${url.parse(link.href).host}...</a>`);
    }
    
    return new_text;
  }
}

module.exports = BroadcastMessage;
