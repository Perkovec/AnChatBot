class PhotoSize {
  constructor(photosize) {
    this.file_id = photosize.file_id;
    this.width = photosize.width;
    this.height = photosize.height;
    this.file_size = photosize.file_size || null;
  }
}

module.exports = PhotoSize;
