const request = require('superagent');
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
  }

  callMethod(name, data) {
    return new Promise((resolve, reject) => {
      try {
      request
        .post(this.apiURL + name)
        .send(data)
        .end((err, res) => {
          if (err) reject(err);
          if (res && typeof res.body === 'object') {
            if (res.body.ok) {
              resolve(res.body.result);
            } else {
              res.body.reqData = data;
              this.logger.error(res.body);
              this.listeners.onError(data, res.body);
              reject(res.body);
            }
          } else {
            if (res && res.body) {
              res.body.reqData = data;
              this.logger.error(res.body);
              reject(res.body);
            } else {
              this.logger.error(`no body, method: ${name}, data: ${JSON.stringify(data)}`);
              reject(`no body, method: ${name}, data: ${JSON.stringify(data)}`);
            }
          }
        });
      } catch(e) {
        this.logger.error(`request error ${e}\nmethod: ${name}, data: ${data}`);
      }
    });
  }

  polling() {
    const onMessage = this.listeners.onMessage;
    this.getUpdates({
      offset: this.offset,
    }).then((updates) => {
      if (onMessage) {
        for (const update of updates) {
          if (update.message) {
            onMessage(new Message(update.message, this));
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
    });
  }

  buildMethods() {
    return {
      sendMessage: this.sendMessage,
      getFile: this.getFile
    };
  }

  onMessage(listener) {
    this.listeners.onMessage = listener;
  }

  onError(listener) {
    this.listeners.onError = listener;
  }

  run() {
    if (!this.configs.webhook) {
      this.callMethod('setWebhook', {
        url: '',
      })
      .then(() => this.polling())
    } else {
      http.createServer((request, response) => {
        console.log(re)
        if(request.method === "POST") {
          let requestBody = '';
          request.on('data', function(data) {
            requestBody += data;
          });
          request.on('end', function() {
            conosle.log(requestBody);
            response.writeHead(200);
            response.end();
          });
        }
      })
      .listen(this.configs.webhook_port, () => {
        request
          .post(`${this.apiURL}setWebhook`)
          .field('url', this.configs.webhook_ip)
          .attach('certificate', this.configs.certificate_path)
          .end((err, res) => {
            if (err) {
              console.log(err);
            } else {
              console.log(res.body);
            }
          });
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
}

module.exports = API;
