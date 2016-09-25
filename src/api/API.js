const request = require('superagent');
const Message = require('./message-model');

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
      request
        .post(this.apiURL + name)
        .send(data)
        .end((err, res) => {
          if (err) reject(err);
          if (res && typeof res.body === 'object') {
            if (res.body.ok) {
              resolve(res.body.result);
            } else {
              this.logger.error(res.body);
              reject(res.body);
            }
          } else {
            this.logger.error((res && res.body) || 'no body');
            reject(res.body);
          }
        });
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
    };
  }

  onMessage(listener) {
    this.listeners.onMessage = listener;
  }

  startPolling() {
    if (!this.configs.webhook) {
      this.polling();
    } else {
      console.log('Polling not enabled (webhook: true)'); // eslint-disable-line no-console
    }
  }

  getUpdates(data) {
    return this.callMethod('getUpdates', data);
  }

  sendMessage(data) {
    return this.callMethod('sendMessage', data);
  }
}

module.exports = API;
