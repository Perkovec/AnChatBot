class BroadcastPlaneMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(text, excludeid, parsemode, self) {
    function onSendEnd(value) {
      const document = {
        _id: `message${new Date().getTime()}`,
      };

      for (let i = 0; i < value.length; i += 1) {
        const key = Object.keys(value[i])[0];
        document[key] = value[i][key];
      }
      if (self) {
        document[`user_${self.id}`] = self.message_id;
      }

      this.DB.insert('anchat_messages', document);
    }

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
      const promises = [];
      for (let i = 0; i < users.length; i += 1) {
        if (users[i].tg_id !== excludeid) {
          const sendData = {
            chat_id: users[i].tg_id,
            text,
          };
          if (parsemode) sendData.parse_mode = parsemode;
          promises.push(
            this.API.sendMessage(sendData)
            .then((response) => {
              const rt = { [`user_${users[i].tg_id}`]: response.message_id };
              return rt;
            })
          );
        }
      }
      Promise.all(promises).then(value => onSendEnd.bind(this)(value));
    });
  }
}

module.exports = BroadcastPlaneMessage;
