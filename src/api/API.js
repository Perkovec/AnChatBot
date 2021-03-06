const request = require('axios');
const Message = require('./message-model');
const http = require('http');

class API {
  constructor(configs) {
    this.configs = configs;
    this.token = configs.token;
    this.logger = configs.logger;
    this.apiURL = `https://api.telegram.org/bot${this.token}/`;
    this.offset = 0;
    this.listeners = {};
    this.$retry = 0;

    process.on('unhandledRejection', (reason) => { this.logger.error(`Unhandled reject: ${reason}`); });
  }

  callMethod(name, data) {
    return new Promise((resolve, reject) => {
      try {
        request
        .post(this.apiURL + name, data)
        .then((res) => {
          if (res && typeof res.data === 'object') {
            if (res.data.ok) {
              resolve(res.data.result);
            } else {
              const errData = res.data;
              errData.reqData = data;
              this.logger.error(errData);
              this.listeners.onError(data, errData);
              reject(errData);
            }
          } else if (res && res.data) {
            const errData = res.data;
            errData.reqData = data;
            this.logger.error(errData);
            reject(errData);
          } else {
            this.logger.error(`no body, method: ${name}, data: ${JSON.stringify(data)}`);
            reject(`no body, method: ${name}, data: ${JSON.stringify(data)}`);
          }
        })
        .catch((e) => {
          this.logger.error(`request error ${e}\nmethod: ${name}, data: ${JSON.stringify(data)}`);
          this.listeners.onReqError(data, e, name);
        });
      } catch (e) {
        this.logger.error(`request error ${e}\nmethod: ${name}, data: ${JSON.stringify(data)}`);
        this.listeners.onReqError(data, e, name);
      }
    });
  }

  polling() {
    const onMessage = this.listeners.onMessage;
    const onUpdate = this.listeners.onUpdate;
    this.getUpdates({
      offset: this.offset,
    }).then((updates) => {
      if (onMessage || onUpdate) {
        for (const update of updates) {
          if (update.message) {
            onMessage(new Message(update.message, this));
          } else if (update.edited_message) {
            onUpdate(new Message(update.edited_message, this));
          } else {
            this.logger.warn(`Unknown update type: ${JSON.stringify(update)}`);
          }
        }
      }
      const lastUpdate = updates[updates.length - 1];
      if (lastUpdate) {
        this.offset = lastUpdate.update_id + 1;
      }
      this.polling();
    }, this.polling);
  }

  onMessage(listener) {
    this.listeners.onMessage = listener;
  }

  onUpdate(listener) {
    this.listeners.onUpdate = listener;
  }

  onError(listener) {
    this.listeners.onError = listener;
  }

  onReqError(listener) {
    this.listeners.onReqError = listener;
  }

  run() {
    if (!this.configs.webhook) {
      this.callMethod('setWebhook', {
        url: '',
      })
      .then(() => this.polling());
    } else {
      http.createServer((req, response) => {
        if (req.method === 'POST') {
          let requestBody = ''; // eslint-disable-line no-unused-vars
          req.on('data', (data) => {
            requestBody += data;
          });
          req.on('end', () => {
            response.writeHead(200);
            response.end();
          });
        }
      })
      .listen(this.configs.webhook_port, () => {
        /* request
          .post(`${this.apiURL}setWebhook`)
          .field('url', this.configs.webhook_ip)
          .attach('certificate', this.configs.certificate_path)
          .end((err, res) => {
            if (err) {
              console.log(err);
            } else {
              console.log(res.body);
            }
          }); */
      });
    }
  }

  getUpdates(data) {
    return this.callMethod('getUpdates', data);
  }

  sendMessage(data) {
    return this.callMethod('sendMessage', data);
  }

  sendAudio(data) {
    return this.callMethod('sendAudio', data);
  }

  sendPhoto(data) {
    return this.callMethod('sendPhoto', data);
  }

  sendDocument(data) {
    return this.callMethod('sendDocument', data);
  }

  sendSticker(data) {
    return this.callMethod('sendSticker', data);
  }

  sendVideo(data) {
    return this.callMethod('sendVideo', data);
  }

  sendVoice(data) {
    return this.callMethod('sendVoice', data);
  }

  getFile(data) {
    return this.callMethod('getFile', data);
  }

  editMessageText(data) {
    return this.callMethod('editMessageText', data);
  }

  editMessageCaption(data) {
    return this.callMethod('editMessageCaption', data);
  }
}

module.exports = API;
