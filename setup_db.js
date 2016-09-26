const NodeCouchDb = require('node-couchdb');
const config = require('./config.json');

const couch = new NodeCouchDb({
  auth: {
    user: config.couchdb.username,
    pass: config.couchdb.password
  }
});

couch.createDatabase('anchat_users').then(() => {
  couch.update('anchat_users', {
    _id: '_design/anchat_users',
    language: 'javascript',
    views: {
      by_tgid: {
        map: "function(doc) {\n  emit(doc.tg_id, doc);\n}"
      },
      count: {
        map: "function(doc) {\n  emit(\"length\", 1);\n}",
        reduce: "function(keys, values, rereduce) {\n  return sum(values);\n}"
      },
      by_isChatUser: {
        map: "function(doc) {\n  if (doc.isChatUser) {\n    emit(doc.tg_id, doc);\n  }\n}"
      }
    }
  }).then(({data, headers, status}) => {
    console.log(data);
  }, err => {
    console.log(err);
  });
}, err => {
  console.log(err);
});