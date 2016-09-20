const request = require('superagent');


class API {
  constructor(configs) {
    this.configs = configs;
    this.token = configs.token;
    this.logger = configs.logger;
    this._apiURL = `https://api.telegram.org/bot${this.token}/`;
    this._offset = 0;
    this._listeners = {};
  }

  _callMethod(name, data) {
    return new Promise((resolve, reject) => {
      request
        .post(this._apiURL + name)
        .send(data)
        .end((err, res) => {
          if (err) reject(err);
          if (typeof(res.body) === 'object') {
            if (res.body.ok) {
              resolve(res.body.result);
            } else {
              this.logger.error(res.body.result);
              reject(res.body.result);
            }
          } else {
            this.logger.warn(res.body);
            reject(res.body);
          }
        });
    });
  }

  _polling() {
    const onMessage = this._listeners.onMessage;
    this.getUpdates({
      offset: this._offset,
    }).then(updates => {
      if (onMessage) {
        for (const update of updates) {
          onMessage(update.message);
        }
      }
      const lastUpdate = updates[updates.length - 1];
      if (lastUpdate) {
        this._offset = lastUpdate.update_id + 1;
      }
      this._polling();
    });
  }

  onMessage(listener) {
    this._listeners.onMessage = listener;
  }
  
  startPolling() {
    if (!this.configs.webhook) {
      this._polling();
    } else {
      console.log('Polling not enabled (webhook: true)');
    }
  }

  getUpdates(data) {
    return this._callMethod('getUpdates', data);
  }
}

module.exports = API;