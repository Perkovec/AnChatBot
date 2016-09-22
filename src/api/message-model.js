const User = require('./user-model');

class Message {
  constructor(msg, api) {
    this.message_id = msg.message_id;
    this.from = msg.from !== undefined ? new User(msg.from, api) : null;

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
