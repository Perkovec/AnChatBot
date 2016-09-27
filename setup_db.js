const NodeCouchDb = require('node-couchdb');
const config = require('./config.json');

const _design = {
  _id: '_design/anchat_users',
  language: 'javascript',
  views: {
    by_tgid: {
      map: "function(doc) {\n  emit(doc.tg_id, doc);\n}"
    },
    by_chatid: {
      map: "function(doc) {\n  emit(doc.id, doc);\n}"
    },
    by_nick: {
      map: "function(doc) {\n  emit(doc.name, doc);\n}"
    },
    count: {
      map: "function(doc) {\n  emit(\"length\", 1);\n}",
      reduce: "function(keys, values, rereduce) {\n  return sum(values);\n}"
    },
    by_isChatUser: {
      map: "function(doc) {\n  if (doc.isChatUser) {\n    emit(doc.tg_id, doc);\n  }\n}"
    }
  }
};

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

couch.createDatabase('anchat_users').then(() => {
  createDocument();
}, err => {
  if (err.code === 'EDBEXISTS') {
    createDocument();
  } else {
    console.log(err);
  }
});

function createDocument() {
  couch.insert('anchat_users', _design).then(({data, headers, status}) => {
    console.log(data);
  }, err => {
    if (err.code === 'EDOCCONFLICT') {
      couch.get('anchat_users', '_design/anchat_users')
      .then(({data}) => {
        const newDesign = Object.assign(_design, {_rev: data._rev})
        couch.update('anchat_users', newDesign)
      });
    } else {
      console.log(err);
    }
  });
}