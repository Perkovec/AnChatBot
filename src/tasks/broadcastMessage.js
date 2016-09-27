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
    let text;
    if (msg.caption) {
      text = `${nickname}: ${msg.caption}`;
    } else {
      text = Util.format(local.voice_from_user, [nickname]);
    }
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      if (reply.id === msg.from.id) {
        reply_msg = `${nickname}: ${replyText}`;
      } else {
        replyText = replyText.startsWith('В ответ на:') ? Util.cutLines(replyText, 3) : replyText;
        reply_msg = replyText;
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
    let text;
    if (msg.caption) {
      text = `${nickname}: ${msg.caption}`;
    } else {
      text = Util.format(local.video_from_user, [nickname]);
    }
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
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
    console.log('sticker')
    const nickname = UserData.name;
    let text = Util.format(local.sticker_from_user, [nickname]);
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
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
    let text;
    if (msg.caption) {
      text = `${nickname}: ${msg.caption}`;
    } else {
      text = Util.format(local.document_from_user, [nickname]);
    }
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
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
    let text;
    if (msg.caption) {
      text = `${nickname}: ${msg.caption}`;
    } else {
      text = Util.format(local.photo_from_user, [nickname]);
    }
    
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
      }

      reply_msg = Util.truncate(reply_msg, 25).replace(/\n/g, ' ');
      text = Util.format(local.reply_to, [reply_msg, text]);
    }

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
    let text = Util.format(local.audio_from_user, [nickname]);
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let replyText = reply.text || reply.caption;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
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
    let text = `${nickname}: ${msg.text}`;
    if (msg.reply_to_message !== null) {
      const reply = msg.reply_to_message;
      let reply_msg;
      const reply_text = reply.text || reply.caption;
      if (reply.from.id === msg.from.id) {
        reply_msg = `${nickname}: ${reply_text}`;
      } else {
        reply_msg = reply_text.startsWith('В ответ на:') ? Util.cutLines(reply_text, 3) : reply_text;
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
}

module.exports = BroadcastMessage;