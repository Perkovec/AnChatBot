class BroadcastPlaneMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(text, excludeid, parsemode) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== excludeid) {
          const sendData = {
            chat_id: rows[i].key,
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
