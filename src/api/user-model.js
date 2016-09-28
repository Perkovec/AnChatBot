class User {
  constructor(user, api) {
    this.id = user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name || null;
    this.username = user.username || null;

    this.$api = api;
    this.registerMethods();
  }

  registerMethods() {
    this.sendMessage = (data) => {
      const sendData = Object.assign(data, { chat_id: this.id });
      return this.$api.sendMessage(sendData);
    };
  }
}

module.exports = User;
