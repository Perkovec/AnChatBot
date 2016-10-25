const NodeCouchDb = require('node-couchdb');
const config = require('./config.json');

let DBConfig;
if (config.couchdb.username && config.couchdb.password) {
  DBConfig = {
    auth: {
      user: config.couchdb.username,
      pass: config.couchdb.password
    }
  }
} else {
  DBConfig = {};
}

const couch = new NodeCouchDb(DBConfig);

module.exports = function(cb) {
  const allDels = [];
  couch.get(
    'anchat_messages',
    '_design/anchat_messages/_view/all',
    {}).then(({data, headers, status}) => {
      const rows = data.rows;
      for (let i = 0, len = rows.length; i < len; i += 1) {
        if ((new Date()) - rows[i].key > 2 * 24 * 60 * 60 * 1000) {
          allDels.push(couch.del("anchat_messages", rows[i].id, rows[i].value._rev));
        }
      }
      Promise.all(allDels).then(() => {
        cb();
      });
    }, err => {
      console.log(err)
  });
}

