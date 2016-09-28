const User = require('./user-model');
const Chat = require('./chat-model');
const Audio = require('./audio-model');
const Document = require('./document-model');
const Sticker = require('./sticker-model');
const Video = require('./video-model');
const Voice = require('./voice-model');
const PhotoSize = require('./photosize-model');
const MessageEntity = require('./messageentity-model');

class Message {
  constructor(msg, api) {
    this.message_id = msg.message_id;
    this.from = msg.from !== undefined ? new User(msg.from, api) : null;
    this.date = msg.date;
    this.chat = new Chat(msg.chat, api);
    this.forward_from = msg.forward_from !== undefined ? new User(msg.forward_from, api) : null;
    this.forward_from_chat = msg.forward_from_chat !== undefined ?
      new Chat(msg.forward_from_chat, api) : null;
    this.forward_date = msg.forward_date || null;
    this.reply_to_message = msg.reply_to_message !== undefined ?
      new Message(msg.reply_to_message, api) : null;
    this.edit_date = msg.edit_date || null;
    this.audio = msg.audio !== undefined ? new Audio(msg.audio, api) : null;
    this.photo = msg.photo !== undefined ? Message.$photoSizes(msg.photo) : null;
    this.document = msg.document !== undefined ? new Document(msg.document) : null;
    this.sticker = msg.sticker !== undefined ? new Sticker(msg.sticker) : null;
    this.video = msg.video !== undefined ? new Video(msg.video) : null;
    this.voice = msg.voice !== undefined ? new Voice(msg.voice) : null;
    this.entities = msg.entities !== undefined ? Message.$messageEntities(msg.entities) : null;
    this.caption = msg.caption || null;
    this.text = msg.text || null;
    this.$api = api;
    this.registerMethods();
  }

  static $photoSizes(photos) {
    const out = [];
    for (let i = 0; i < photos.length; i += 1) {
      out.push(new PhotoSize(photos[i]));
    }
    return out;
  }

  static $messageEntities(entities) {
    const out = [];
    for (let i = 0; i < entities.length; i += 1) {
      out.push(new MessageEntity(entities[i]));
    }
    return out;
  }

  registerMethods() {
    this.sendMessage = data => this.from.sendMessage(data);
  }
}

module.exports = Message;
