const Util = require('./util');

class DBWrapper {
  static wrap(db) {
    return Object.assign(db, {
      $getUserByTgId: DBWrapper.$getUserByTgId.bind(db),
      $getChatUsers: DBWrapper.$getChatUsers.bind(db),
      $getBannedUsers: DBWrapper.$getBannedUsers.bind(db),
      $getUserByNickname: DBWrapper.$getUserByNickname.bind(db),
      $getUserByChatId: DBWrapper.$getUserByChatId.bind(db),
      $updateDocumentFields: DBWrapper.$updateDocumentFields.bind(db),
      $updateUserLastMessage: DBWrapper.$updateUserLastMessage.bind(db),
      $getRepliesById: DBWrapper.$getRepliesById.bind(db),
    });
  }

  static $getUserByTgId(userId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_tgid',
      { key: userId })
    .then(({ data }) => {
      const user = data.rows && data.rows.length > 0 ? data.rows[0].value : null;
      return user;
    });
  }

  static $getUserByNickname(userId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_nick',
      { key: userId })
    .then(({ data }) => {
      const user = data.rows && data.rows.length > 0 ? data.rows[0].value : null;
      return user;
    });
  }

  static $getUserByChatId(chatId) {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_chatid',
      { key: chatId.toUpperCase() })
    .then(({ data }) => {
      const user = data.rows && data.rows.length > 0 ? data.rows[0].value : null;
      return user;
    });
  }

  static $updateDocumentFields(data, fields) {
    const newData = Object.assign(data, fields);
    return this.update(
      'anchat_users',
      newData);
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
  
  static $getBannedUsers() {
    return this.get(
      'anchat_users',
      '_design/anchat_users/_view/by_isBanned')
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

  static $getRepliesById(id) {
    function findInArray(msgArr, value) {
      for (let i = 0; i < msgArr.length; i += 1) {
        if (typeof msgArr[i] === 'number' && msgArr[i] === value) {
          return true;
        } else if (typeof msgArr[i] === 'object') {
          const keys = Object.keys(msgArr[i]);
          for (let j = 0; j < keys.length; j += 1) {
            if (msgArr[i][keys[j]] === value) {
              return keys[j];
            }
          }
        }
      }
      return false;
    }

    return this.get(
      'anchat_messages',
      '_design/anchat_messages/_view/by_replyid')
    .then(({ data }) => {
      const rows = data.rows;
      for (let i = 0; i < rows.length; i += 1) {
        const isInArray = findInArray(rows[i].key, id);
        if (isInArray) {
          return (isInArray) === 'string' ? { replies: rows[i].value, reply_key: isInArray } : rows[i].value;
        }
      }
      return null;
    });
  }
}

module.exports = DBWrapper;
