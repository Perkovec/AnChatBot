const User = require('./user-model');

class MessageEntity {
  constructor(entity, api) {
    this.type = entity.type;
    this.offset = entity.offset;
    this.length = entity.length;
    this.url = entity.url || null;
    this.user = entity.user !== undefined ? new User(entity.user, api) : null;
  }
}

module.exports = MessageEntity;