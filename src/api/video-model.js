const PhotoSize = require('./photosize-model');

class Video {
  constructor(video) {
    this.file_id = video.file_id;
    this.width = video.width;
    this.height = video.height;
    this.duration = video.duration;
    this.thumb = video.thumb !== undefined ? new PhotoSize(video.thumb) : null;
    this.mime_type = video.mime_type || null;
    this.file_size = video.file_size || null;
  }
}

module.exports = Video;
