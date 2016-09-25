class BroadcastPlaneMessage {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(text, exclude_id) {
    this.DB.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({data}) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].key !== exclude_id) {
          this.API.sendMessage({
            chat_id: rows[i].key,
            text: text
          });
        }
      }
    });
  }
}

module.exports = BroadcastPlaneMessage;
