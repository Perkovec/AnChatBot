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
    .then(({ isChatUser, UserData }) => {
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
          text: local.not_in_chat,
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendVoice({
            chat_id: rows[i].key,
            voice: msg.voice.file_id,
            caption: text,
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendVideo({
            chat_id: rows[i].key,
            video: msg.video.file_id,
            caption: text,
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text,
          })
          .then(() => {
            this.API.sendSticker({
              chat_id: rows[i].key,
              sticker: msg.sticker.file_id,
            });
          });
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendDocument({
            chat_id: rows[i].key,
            document: msg.document.file_id,
            caption: text,
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
    .then(({ data }) => {
      const rows = data.rows;
      const photoId = msg.photo[msg.photo.length - 1].file_id;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendPhoto({
            chat_id: rows[i].key,
            photo: photoId,
            caption: text,
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendAudio({
            chat_id: rows[i].key,
            audio: msg.audio.file_id,
            caption: text,
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
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== msg.from.id) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text,
            parse_mode: 'HTML',
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
        { key: id })
      .then(({ data }) => {
        const rows = data.rows;
        if (!rows.length || !rows[0].value.isChatUser) {
          resolve({ isChatUser: false });
        } else {
          resolve({ isChatUser: true, UserData: rows[0].value });
        }
      }, reject);
    });
  }

  $updateUserLastMessage(id) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      { key: id })
    .then(({ data }) => {
      const rows = data.rows;
      const newData = Object.assign(rows[0].value, {
        _id: rows[0].id,
        _rev: rows[0].value._rev, // eslint-disable-line no-underscore-dangle
        lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
      });
      this.DB.update('anchat_users', newData);
    });
  }

  $getTextToSend(msg, nickname, template) {
    let text;
    if (msg.caption || !template) {
      text = msg.caption ? msg.caption : BroadcastMessage.$linkShortener(msg);
      text = `${nickname}: ${text}`;
    } else {
      text = Util.escapeHtml(Util.format(template, [nickname]));
    }

    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let replyMsg;
      if (reply.from.id === msg.from.id) {
        replyMsg = `${nickname}: ${replyText}`;
      } else if (replyText) {
        replyText = replyText.startsWith('В ответ на:') ? Util.cutLines(replyText, 3) : replyText;
        replyMsg = replyText;
      }

      replyMsg = Util.truncate(replyMsg, 25).replace(/\n/g, ' ');
      text = Util.format(local.reply_to, [replyMsg, text]);
    }
    return text;
  }

  static $linkShortener(msg) {
    if (!msg.entities) return msg.text;

    let newText = Util.escapeHtml(msg.text);
    const links = linkify.find(msg.text, 'url');
    for (let i = 0; i < links.length; i += 1) {
      const link = links[0];
      newText = newText.replace(Util.escapeHtml(link.value), `<a href="${link.href}">${url.parse(link.href).host}...</a>`);
    }

    return newText;
  }
}

module.exports = BroadcastMessage;
