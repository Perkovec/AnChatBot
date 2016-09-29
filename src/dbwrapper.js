const Util = require('./util');

class DBWrapper {
  static wrap(db) {
    return Object.assign(db, {
      $getUserByTgId: DBWrapper.$getUserByTgId.bind(db),
      $getChatUsers: DBWrapper.$getChatUsers.bind(db),
      $getUserByNickname: DBWrapper.$getUserByNickname.bind(db),
      $getUserByChatId: DBWrapper.$getUserByChatId.bind(db),
      $updateDocumentFields: DBWrapper.$updateDocumentFields.bind(db),
      $updateUserLastMessage: DBWrapper.$updateUserLastMessage.bind(db)
    });
  }

  static $getUserByTgId(userId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      { key: userId })
    .then(({ data }) => {
      return data.rows && data.rows.length > 0 ? data.rows[0].value : null;
    });
  }

  static $getUserByNickname(userId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_nick',
      { key: userId })
    .then(({ data }) => {
      return data.rows && data.rows.length > 0 ? data.rows[0].value : null;
    });
  }

  static $getUserByChatId(chatId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      { key: chatId.toUpperCase() })
    .then(({ data }) => {
      return data.rows && data.rows.length > 0 ? data.rows[0].value : null;
    });
  }

  static $updateDocumentFields(data, fields) {
    const newData = Object.assign(data, fields);
    return this.update(
      'anchat_users',
      newData)
  }

  static $getChatUsers() {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isChatUser')
    .then(({ data }) => {
      const rows = data.rows.map(row => row.value);

      return rows;
    });
  }

  static $updateUserLastMessage(id) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      { key: id })
    .then(({ data }) => {
      const rows = data.rows;
      const newData = Object.assign(rows[0].value, {
        lastMessage: Util.UTCTime(), // eslint-disable-line new-cap
      });
      return this.update('anchat_users', newData);
    });
  }
}

module.exports = DBWrapper;