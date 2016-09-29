class BroadcastPlaneMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(text, excludeid, parsemode) {
    this.DB.$getChatUsers()
    .then(users => {
      for (let i = 0; i < users.length; i += 1) {
        if (users[i].tg_id !== excludeid) {
          const sendData = {
            chat_id: users[i].tg_id,
            text,
          }
          if (parsemode) sendData.parse_mode = parsemode;
          this.API.sendMessage(sendData);
        }
      }
    });
  }
}

module.exports = BroadcastPlaneMessage;
