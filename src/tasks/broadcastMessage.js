const Util = require('../util');
const local = require('../locals/ru.json');

class BroadcastMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    this.DB.$getUserByTgId(msg.from.id)
    .then((user) => {
      if (user.banned) {
        msg.sendMessage({
          text: local.you_are_banned,
        });
      } else if (user && user.isChatUser) {
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
    function onSendEnd(value) {
      const document = {
        _id: `message${new Date().getTime()}`,
      };

      for (let i = 0; i < value.length; i += 1) {
        const key = Object.keys(value[i])[0];
        document[key] = value[i][key];
      }
      document[`user_${data.msg.from.id}`] = data.msg.message_id;

      this.DB.insert('anchat_messages', document);
    }

    const nickname = data.user.name;
    BroadcastMessage.$getTextToSend(data.msg, nickname, data.template)
    .then((text) => {
      this.DB.$getChatUsers()
      .then((users) => {
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
        if (data.msg.reply_to_message) {
          this.DB.$getRepliesById(data.msg.reply_to_message.message_id)
          .then((replies) => {
            const promises = [];
            for (let i = 0; i < users.length; i += 1) {
              if (users[i].tg_id !== data.msg.from.id) {
                let reply;
                if (replies) {
                  if (replies.reply_key) {
                    reply = replies.replies[`user_${users[i].tg_id}`];
                    if (typeof reply === 'object') {
                      reply = reply[replies.reply_key];
                    }
                  } else {
                    reply = replies[`user_${users[i].tg_id}`];
                  }

                  if (typeof reply === 'object') {
                    reply = reply.sticker;
                  }
                }
                promises.push(data.cb(users[i], text, reply));
              }
            }
            Promise.all(promises).then(value => onSendEnd.bind(this)(value));
          });
        } else {
          const promises = [];
          for (let i = 0; i < users.length; i += 1) {
            if (users[i].tg_id !== data.msg.from.id) {
              promises.push(data.cb(users[i], text));
            }
          }
          Promise.all(promises).then(value => onSendEnd.bind(this)(value));
        }

        this.DB.$updateUserLastMessage(data.msg.from.id);
      });
    });
  }

  $sendVoice(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.voice_from_user,
      cb(receiver, text, replyId) {
        return API.sendVoice({
          chat_id: receiver.tg_id,
          voice: msg.voice.file_id,
          caption: text,
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  $sendVideo(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.video_from_user,
      cb(receiver, text, replyId) {
        return API.sendVideo({
          chat_id: receiver.tg_id,
          video: msg.video.file_id,
          caption: text,
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  $sendSticker(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.sticker_from_user,
      cb(receiver, text, replyId) {
        let firstId = null;
        return API.sendMessage({
          chat_id: receiver.tg_id,
          text,
          reply_to_message_id: replyId,
        })
        .then((response) => {
          firstId = response.message_id;
          return API.sendSticker({
            chat_id: receiver.tg_id,
            sticker: msg.sticker.file_id,
          });
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: { text: firstId, sticker: response.message_id } };
          return rt;
        });
      },
    });
  }

  $sendDocument(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.document_from_user,
      cb(receiver, text, replyId) {
        return API.sendDocument({
          chat_id: receiver.tg_id,
          document: msg.document.file_id,
          caption: text,
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  $sendPhoto(msg, user) {
    const API = this.API;
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    this.$sendEach({
      msg,
      user,
      template: local.photo_from_user,
      cb(receiver, text, replyId) {
        return API.sendPhoto({
          chat_id: receiver.tg_id,
          photo: photoId,
          caption: text,
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  $sendAudio(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      template: local.audio_from_user,
      cb(receiver, text, replyId) {
        return API.sendDocument({
          chat_id: receiver.tg_id,
          audio: msg.audio.file_id,
          caption: text,
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  $sendText(msg, user) {
    const API = this.API;
    this.$sendEach({
      msg,
      user,
      cb(receiver, text, replyId) {
        return API.sendMessage({
          chat_id: receiver.tg_id,
          text,
          parse_mode: 'HTML',
          reply_to_message_id: replyId,
        }).then((response) => {
          const rt = { [`user_${receiver.tg_id}`]: response.message_id };
          return rt;
        });
      },
    });
  }

  static $getTextToSend(msg, nickname, template) {
    return new Promise((resolve) => {
      let text = '';
      if (msg.caption || (!template && msg.text)) {
        text = msg.caption ? msg.caption : Util.linkShortener(msg.text);
        text = `${nickname}: ${text}`;
      } else {
        text = Util.escapeHtml(Util.format(template, [nickname]));
      }

      resolve(text);
    });
  }
}

module.exports = BroadcastMessage;
