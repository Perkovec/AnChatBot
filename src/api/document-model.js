const PhotoSize = require('./photosize-model');

class Document {
  constructor(document) {
    this.file_id = document.file_id;
    this.thumb = document.thumb !== undefined ? new PhotoSize(document.thumb) : null;
    this.file_name = document.file_name || null;
    this.mime_type = document.mime_type || null;
    this.file_size = document.file_size || null;
  }
}

module.exports = Document;
