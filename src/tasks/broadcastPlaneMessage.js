class BroadcastPlaneMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(text, excludeid) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].key !== excludeid) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text,
          });
        }
      }
    });
  }
}

module.exports = BroadcastPlaneMessage;
