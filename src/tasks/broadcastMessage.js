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
    this.DB.$getUserByTgId(msg.from.id)
    .then(user => {
      if (user && user.isChatUser) {
        if (msg.text) {
          this.$sendText(msg, user);
        } else if (msg.audio) {
          this.$sendAudio(msg, user);
        } else if (msg.photo) {
          this.$sendPhoto(msg, user);
        } else if (msg.document) {
          this.$sendDocument(msg, user);
        } else if (msg.sticker) {
          this.$sendSticker(msg, user);
        } else if (msg.video) {
          this.$sendVideo(msg, user);
        } else if (msg.voice) {
          this.$sendVoice(msg, user);
        }
      } else {
        msg.sendMessage({
          text: local.not_in_chat,
        });
      }
    });
  }

  $sendEach(data) {
    const nickname = data.user.name;
    this.$getTextToSend(data.msg, nickname, data.template)
    .then(text => {
      this.DB.$getChatUsers()
      .then(users => {
        for (let i = 0; i < users.length; i += 1) {
          if (users[i].tg_id !== data.msg.from.id) {
            data.cb(users[i], text);
          }
        }
        this.DB.$updateUserLastMessage(data.msg.from.id);
      });
    });
  };

  $sendVoice(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.voice_from_user,
      cb(receiver, text) {
        API.sendVoice({
          chat_id: receiver.tg_id,
          voice: msg.voice.file_id,
          caption: text,
        });
      }
    });
  }

  $sendVideo(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.video_from_user,
      cb(receiver, text) {
        API.sendVideo({
          chat_id: receiver.tg_id,
          video: msg.video.file_id,
          caption: text,
        });
      }
    });
  }

  $sendSticker(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.sticker_from_user,
      cb(receiver, text) {
        API.sendMessage({
          chat_id: receiver.tg_id,
          text,
        })
        .then(() => {
          API.sendSticker({
            chat_id: receiver.tg_id,
            sticker: msg.sticker.file_id,
          });
        });
      }
    });
  }

  $sendDocument(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.document_from_user,
      cb(receiver, text) {
        API.sendDocument({
          chat_id: receiver.tg_id,
          document: msg.document.file_id,
          caption: text,
        });
      }
    });
  }

  $sendPhoto(msg, user) {
    const API = this.API;
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    this.$sendEach({
      msg,
      user,
      template: local.photo_from_user,
      cb(receiver, text) {
        API.sendPhoto({
          chat_id: receiver.tg_id,
          photo: photoId,
          caption: text,
        });
      }
    });
  }

  $sendAudio(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.audio_from_user,
      cb(receiver, text) {
        API.sendDocument({
          chat_id: receiver.tg_id,
          audio: msg.audio.file_id,
          caption: text,
        });
      }
    });
  }

  $sendText(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      cb(receiver, text) {
        API.sendMessage({
          chat_id: receiver.tg_id,
          text,
          parse_mode: 'HTML',
        });
      }
    });
  }
  
  $getTextToSend(msg, nickname, template) {
    function getReplyText(reply) {
      if (!reply.text && !reply.caption) {
        if (reply.sticker) {
          return local.reply_to_sticker;
        }
      } else {
        return (reply.text || reply.caption);
      }
    }

    function getReplyFormatText(reply) {
      if (reply.photo) {
        return local.photo_from_user;
      } else if (reply.audio) {
        return local.audio_from_user;
      } else if (reply.document) {
        return local.document_from_user;
      } else if (reply.sticker) {
        return local.sticker_from_user;
      } else if (reply.video) {
        return local.video_from_user;
      } else if (reply.voice) {
        return local.voice_from_user;
      }
    }

    return new Promise((resolve, reject) => {
      let text = '';
      if (msg.caption || (!template && msg.text)) {
        text = msg.caption ? msg.caption : Util.linkShortener(msg.text);
        text = `${nickname}: ${text}`;
      } else {
        text = Util.escapeHtml(Util.format(template, [nickname]));
      }

      if (msg.reply_to_message) {
        const reply = msg.reply_to_message;
        if (reply.from.id === msg.from.id) {
          const replyText = getReplyText(reply);
          let replyMsg;
          if (getReplyText(reply)) {
            replyMsg = `${nickname}: ${replyText}`;
          } else {
            replyMsg = Util.format(getReplyFormatText(reply), [nickname]);
          }
          replyMsg = Util.truncate(replyMsg, 25).replace(/\n/g, ' ');
          resolve(Util.format(local.reply_to, [replyMsg, text]));
        } else {
          resolve(Util.format(local.reply_to, [getReplyText(reply), text]));
        }
      }
      
      resolve(text);
    });
  }
}

module.exports = BroadcastMessage;
