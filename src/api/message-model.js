const User = require('./user-model');
const Chat = require('./chat-model');
const Audio = require('./audio-model');

class Message {
  constructor(msg, api) {
    this.message_id = msg.message_id;
    this.from = msg.from !== undefined ? new User(msg.from, api) : null;
    this.date = msg.date;
    this.chat = new Chat(msg.chat, api);
    this.forward_from = msg.forward_from !== undefined ? new User(msg.forward_from, api) : null;
    this.forward_from_chat = msg.forward_from_chat !== undefined ? new Chat(msg.forward_from_chat, api) : null;
    this.forward_date = msg.forward_date || null;
    this.reply_to_message = msg.reply_to_message !== undefined ? new Message(msg.reply_to_message, api) : null;
    this.edit_date = msg.edit_date || null;
    this.audio = msg.audio !== undefined ? new Audio(msg.audio, api) : null;

    this.text = msg.text || null;

    this.$api = api;
    this.registerMethods();
  }

  registerMethods() {
    this.sendMessage = (data) => {
      return this.from.sendMessage(data);
    }
  }
}

module.exports = Message;
