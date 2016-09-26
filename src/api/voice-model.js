class Voice {
  constructor(voice) {
    this.file_id = voice.file_id;
    this.duration = voice.duration;
    this.mime_type = voice.mime_type || null;
    this.file_size = voice.file_size || null;
  }
}

module.exports = Voice;
