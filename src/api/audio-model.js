class Audio {
  constructor(audio, api) {
    this.file_id = audio.file_id;
    this.duration = audio.duration;
    this.performer = audio.performer || null;
    this.title = audio.title || null;
    this.mime_type = audio.mime_type || null;
    this.file_size = audio.file_size || null;
  
    this.$api = api;
    this.registerMethods();
  }

  registerMethods() {
    this.getFile = () => {
      return this.$api.getFile({
        file_id: this.file_id
      });
    }
  }
}

module.exports = Audio;
