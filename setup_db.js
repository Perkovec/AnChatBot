const NodeCouchDb = require('node-couchdb');
const config = require('./config.json');

const _design_users = {
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

const _design_messages = {
  _id: '_design/anchat_messages',
  language: 'javascript',
  views: {
    by_replyid: {
      map: "function(doc) {\nvar keys = Object.keys(doc);\nvar doc_key = [];\nfor(var i = 0; i < keys.length; i += 1){\nif (keys[i] !== '_id' && keys[i] !== '_rev') {\ndoc_key.push(doc[keys[i]]);\n}\n}\nemit(doc_key, doc);\n}"
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
  createUsersDocument();
}, err => {
  if (err.code === 'EDBEXISTS') {
    createUsersDocument();
  } else {
    console.log(err);
  }
});

couch.createDatabase('anchat_messages').then(() => {
  createMessagesDocument();
}, err => {
  if (err.code === 'EDBEXISTS') {
    createMessagesDocument();
  } else {
    console.log(err);
  }
});

function createUsersDocument() {
  couch.insert('anchat_users', _design_users).then(({data, headers, status}) => {
    console.log(data);
  }, err => {
    if (err.code === 'EDOCCONFLICT') {
      couch.get('anchat_users', '_design/anchat_users')
      .then(({data}) => {
        const newDesign = Object.assign(_design_users, {_rev: data._rev})
        couch.update('anchat_users', newDesign)
      });
    } else {
      console.log(err);
    }
  });
}

function createMessagesDocument() {
  couch.insert('anchat_messages', _design_messages).then(({data, headers, status}) => {
    console.log(data);
  }, err => {
    if (err.code === 'EDOCCONFLICT') {
      couch.get('anchat_messages', '_design/anchat_messages')
      .then(({data}) => {
        const newDesign = Object.assign(_design_messages, {_rev: data._rev})
        couch.update('anchat_messages', newDesign)
      });
    } else {
      console.log(err);
    }
  });
}