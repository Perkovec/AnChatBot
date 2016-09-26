const PhotoSize = require('./photosize-model');

class Sticker {
  constructor(sticker) {
    this.file_id = sticker.file_id;
    this.width = sticker.width;
    this.height = sticker.height;
    this.thumb = sticker.thumb !== undefined ? new PhotoSize(sticker.thumb) : null;
    this.emoji = sticker.emoji || null;
    this.file_size = sticker.file_size || null;
  }
}

module.exports = Sticker;
