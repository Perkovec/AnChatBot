const Nickname = require('./nick');
const Util = require('./util');
const local = require('./locals/ru.json');
const CRegex = {
  start: /^(\/start)$/i
};

const userGroups = {
  NEWBIE: 0,
  USER: 1,
  ADMIN: 100,
};

class MsgProcessor {
  constructor(api, db) {
    this.API = api;
    this.DB = db;
  }

  process(msg) {
    const text = msg.text;
    
    if (CRegex.start.test(text)) {
      this.$start(msg);
      /*console.log(text);
      try {
      msg.sendMessage({
        text: Util.format(local.start, [Nickname.generate(2)]),
      });
      } catch(e) {
        console.log(e)
      }*/
      //try {
      //this.DB.insert(512, [50, 10, 'my key', 30]).then(a => console.log(a), err => console.log(err));
      //} catch(e) {console.log(e)}
    }
  }

  $start(msg) {
    this.DB.select('anchat_users', 0, 1, 0, 'eq', [msg.from.id])
    .then((results) => {
      if (!results.length) {
        //this.DB.insert(512, [msg.from.id, userGroups.NEWBIE, ]);
      }
    });
  }
}

module.exports = MsgProcessor;
