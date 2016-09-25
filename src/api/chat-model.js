class Chat {
  constructor(chat, api) {
    this.id = chat.id;
    this.type = chat.type;
    this.title = chat.title || null;
    this.username = chat.username || null;
    this.first_name = chat.first_name || null;
    this.last_name = chat.last_name || null;

    this.$api = api;
    this.registerMethods();
  }

  registerMethods() {
    this.sendMessage = (data) => {
      const sendData = Object.assign(data, { chat_id: this.id });
      return this.$api.sendMessage(data);
    }
  }
}

module.exports = Chat;
