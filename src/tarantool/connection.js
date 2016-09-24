const tConstants = require('./const');
const net = require('net');
const EventEmitter = require('events');
const msgpack = require('msgpack-lite');
const crypto = require('crypto');
const xor = require('bitwise-xor');

const states = {
  INITED: 0,
  CONNECTING: 1,
  PREHELLO: 2,
  CONNECTED: 3,
  AWAITING: 4,
};

const defaultOptions = {
    host: 'localhost',
    port: '3301',
    timeout: 0
};

class Connection {
  constructor(options) {
    this.socket = new net.Socket({
      readable: true,
      writable: true
    });
    this.state = states.INITED;
    this.commandsQueue = [];
    this.namespace ={};
    this.msgpack = options.msgpack || msgpack;
    this.options = Object.assign(defaultOptions, options);

    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('end', this.onClose.bind(this));
    this.socket.on('data', this.onData.bind(this));

    this.$req_id = 0;
  }

  onError(error) {
    console.log('error socket', error);
    //this._interupt(error);
    //this._stubMethods();
    this.socket.destroy();
    this.commandsQueue = [];
  }

  onClose() {
    console.log('end by other side');
    //this._interupt('closed connection on other side');
    //this._stubMethods();
  }

  onConnect() {
    this.state = states.PREHELLO;
  }

  onData(data) {
    let trackResult;
    switch(this.state) {
      case states.PREHELLO:
        for (let i = 0; i < this.commandsQueue.length; ++i) {
          if (this.commandsQueue[i][0] == tConstants.RequestCode.rqConnect) {
            this.commandsQueue[i][1].resolve(true);
            this.commandsQueue.splice(i, 1);
            i--;
          }
        }
        this.salt = data.slice(64, 108).toString('utf8');
        this.state = states.CONNECTED;
      break;

      case states.CONNECTED:
        trackResult = this.$responseBufferTrack(data);
        if (trackResult.length == 2) {
          this.state = states.AWAITING;
          this.awaitingResponseLength = trackResult[1];
          this.buffer = trackResult[0];
        } else {
          this.buffer = null;
        }
      break;

      case states.AWAITING:
        trackResult = this.$responseBufferTrack(Buffer.concat([this.buffer, data]), this.awaitingResponseLength);
        if (trackResult.length == 2) {
          this.state = states.AWAITING;
          this.awaitingResponseLength = trackResult[1];
          this.buffer = trackResult[0];
        } else {
          this.buffer = null;
          this.state = states.CONNECTED;
        }
      break;
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.state == states.INITED) {
        this.state = states.CONNECTING;
        this.commandsQueue.push([tConstants.RequestCode.rqConnect, {resolve: resolve, reject: reject}]);
        this.socket.connect({port: this.options.port, host: this.options.host});
      }
    });
  }

  auth(username, password) {
    return new Promise((resolve, reject) => {
      const reqId = this.$getReqId();
      const header = this.$header(tConstants.RequestCode.rqAuth, reqId);
      const buffered = {
        username: this.msgpack.encode(username)
      };
      const scrambled = this.$scramble(password, this.salt);
      const body = Buffer.concat([
        new Buffer([0x82, tConstants.KeysCode.username]),
        buffered.username,
        new Buffer([0x21, 0x92]),
        tConstants.passEnter,
        new Buffer([0xb4]),
        scrambled
      ]);
      this.commandsQueue.push([tConstants.RequestCode.rqAuth, reqId, {resolve: resolve, reject: reject}]);
      this.$request(header, body);
    });
  }

  insert(spaceId, tuple) {
    const reqId = this.$getReqId();
    return this.$replaceInsert(tConstants.RequestCode.rqInsert, reqId, spaceId, tuple);
  }

  select(spaceId, indexId, limit, offset, iterator, key) {
    if (Number.isInteger(key))
      key = [key];

    return new Promise((resolve, reject) => {
      if (typeof(spaceId) == 'string' || typeof(indexId) == 'string') {
        return this.$getMetadata(spaceId, indexId)
          .then(info => {
            return this.select(info[0], info[1], limit, offset, iterator, key);
          })
          .then(resolve)
          .catch(reject);
        }
        const reqId = this.$getReqId();
        const header = this.$header(tConstants.RequestCode.rqSelect, reqId);
        //don't need a key for all iterator
        if (iterator == 'all')
          key = [];

        const buffered = {
          spaceId: this.msgpack.encode(spaceId),
          indexId:  this.msgpack.encode(indexId),
          limit:  this.msgpack.encode(limit),
          offset:  this.msgpack.encode(offset),
          key:  this.msgpack.encode(key)
        };

        const body = Buffer.concat([
            new Buffer([0x86, tConstants.KeysCode.space_id]), buffered.spaceId,
            new Buffer([tConstants.KeysCode.index_id]), buffered.indexId,
            new Buffer([tConstants.KeysCode.limit]), buffered.limit,
            new Buffer([tConstants.KeysCode.offset]), buffered.offset,
            new Buffer([tConstants.KeysCode.iterator, tConstants.IteratorsType[iterator],
                tConstants.KeysCode.key]),
            buffered.key
        ]);
        this.commandsQueue.push([tConstants.RequestCode.rqSelect, reqId, {resolve: resolve, reject: reject}]);
        this.$request(header, body);
    });
  }

  call(functionName) {
    const tuple = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1): [];
    return new Promise((resolve, reject) => {
      const reqId = this.$getReqId();
      const header = this.$header(tConstants.RequestCode.rqCall, reqId);
      const buffered = {
        functionName: this.msgpack.encode(functionName),
        tuple: this.msgpack.encode(tuple ? tuple : [])
      };
      const body = Buffer.concat([
        new Buffer([0x82,tConstants.KeysCode.function_name]),
        buffered.functionName,
        new Buffer([tConstants.KeysCode.tuple]),
        buffered.tuple
      ]);
      this.commandsQueue.push([tConstants.RequestCode.rqCall, reqId, {resolve: resolve, reject: reject}]);
      this.$request(header, body);
    });
  }

  $replaceInsert(cmd, reqId, spaceId, tuple) {
    return new Promise((resolve, reject) => {
      if (Array.isArray(tuple)){
        if (typeof(spaceId)=='string') {
          return this.$getMetadata(spaceId, 0)
            .then(info => {
                return this.$replaceInsert(cmd, reqId, info[0], tuple);
            })
            .then(resolve)
            .catch(reject);
        }
        const header = this.$header(cmd, reqId);
        const buffered = {
          spaceId: this.msgpack.encode(spaceId),
          tuple: this.msgpack.encode(tuple)
        };
        const body = Buffer.concat([new Buffer([0x82,tarantoolConstants.KeysCode.space_id]), buffered.spaceId,
          new Buffer([tarantoolConstants.KeysCode.tuple]), buffered.tuple]);
        this.$request(header, body);
        this.commandsQueue.push([cmd, reqId, {resolve: resolve, reject: reject}]);
      } else {
        reject(new Error('need array'));
      }
    });
  }

  $getSpaceId(name) {
    return this.select(tConstants.Space.space, tConstants.IndexSpace.name, 1, 0,
      tConstants.IteratorsType.all, [name])
      .then(value => {
        if (value && value.length && value[0]) {
          const spaceId = value[0][0];
          this.namespace[name] = {
            id: spaceId,
            name: name,
            indexes: {}
          };
          this.namespace[spaceId] = {
            id: spaceId,
            name: name,
            indexes: {}
          };
          return spaceId;
        } else {
          throw new Error('Cannot read a space name or space is not defined');
        }
      });
  }

  $getIndexId(spaceId, indexName) {
    return this.select(tConstants.Space.index, tConstants.IndexSpace.indexName, 1, 0,
        tConstants.IteratorsType.all, [spaceId, indexName])
        .then(value => {
          if (value && value[0] && value[0].length > 1) {
            const indexId = value[0][1];
            const space = this.namespace[spaceId];
            if (space) {
              this.namespace[space.name].indexes[indexName] = indexId;
              this.namespace[space.id].indexes[indexName] = indexId;
            }
            return indexId;
          } else {
            throw new Error('Cannot read a space name indexes or index is not defined');
          }
        });
  }


  $getMetadata(spaceName, indexName) {
    if (this.namespace[spaceName]) {
      spaceName = this.namespace[spaceName].id;
    }
    if (typeof(this.namespace[spaceName]) != 'undefined' && typeof(this.namespace[spaceName].indexes[indexName]) != 'undefined') {
      indexName = this.namespace[spaceName].indexes[indexName];
    }
    if (typeof(spaceName) == 'string' && typeof(indexName) == 'string') {
      return this.$getSpaceId(spaceName)
        .then(spaceId => {
          return Promise.all([spaceId, this.$getIndexId(spaceId, indexName)]);
        });
    }
    const promises = [];
    if (typeof(spaceName) == 'string') {
      promises.push(this.$getSpaceId(spaceName));
    } else {
      promises.push(spaceName);
    }
    if (typeof(indexName) == 'string') {
      promises.push(this.$getIndexId(spaceName, indexName));
    } else {
      promises.push(indexName);
    }

    return Promise.all(promises);
  }

  $responseBufferTrack(buffer, length) {
    if (!length) {
      if (buffer.length >= 5) {
        length = buffer.readUInt32BE(1);
        buffer = buffer.slice(5);
      }  else {
        return [buffer, null];
      }
    }

    if (buffer.length >= length) {
      if (buffer.length == length) {
        this.$processResponse(buffer);
        return [];
      } else {
        const curBuffer = buffer.slice(0, length);
        this.$processResponse(curBuffer);
        return this.$responseBufferTrack(buffer.slice(length));
      }
    } else {
      return [buffer, length];
    }
  }

  $processResponse(buffer) {
    const dataBuffer = Buffer.concat([new Buffer([0x92]), buffer]);
    const obj = this.msgpack.decode(dataBuffer);

    const reqId = obj[0][1];
	  if (this.schemaId) {
		  if (this.schemaId != obj[0][5]) {
			  this.schemaId = obj[0][5];
			  this.namespace = {};
  		}
	  } else {
		  this.schemaId = obj[0][5];
  	}
    
    let task;
    for(let i = 0; i < this.commandsQueue.length; ++i) {
      task = this.commandsQueue[i];
      if (task[1] == reqId) {
        this.commandsQueue.splice(i, 1);
        break;
      }
    }

    const dfd = task[2];
    const success = obj[0][0] == 0 ? true : false;
    
    if (success) {
      dfd.resolve(this.$processResponseBody(task[0], obj[1][tConstants.KeysCode.data]));
    } else {
      dfd.reject(new Error(obj[1][tConstants.KeysCode.error]));
    }

    if (this.awaitingDestroy && this.commandsQueue.length == 1) {
      this.commandsQueue[0][2].resolve(true);
      this.socket.destroy();
    }
  }

  $processResponseBody(cmd, data) {
    return cmd == tConstants.RequestCode.rqAuth ? true : data;
  }

  $request(header, body) {
    const sumL = header.length + body.length;
    const prefixSizeBuffer = new Buffer(5);
    prefixSizeBuffer[0] = 0xCE;
    prefixSizeBuffer.writeUInt32BE(sumL, 1);
    const buffer = Buffer.concat([prefixSizeBuffer, header, body]);
    this.socket.write(buffer);
  };

  $scramble(password, salt){
    const encSalt = new Buffer(salt, 'base64');
    const step1 = this.$shatransform(password);
    const step2 = this.$shatransform(step1);
    const step3 = this.$shatransform(Buffer.concat([encSalt.slice(0, 20), step2]));
    return xor(step1, step3);
  }

  $header(command, reqId) {
    const header = new Buffer([
      0x82,
      tConstants.KeysCode.code,
      command,
      tConstants.KeysCode.sync,
      0xce,
      0, 0, 0, 0
    ]);
    header.writeUInt32BE(reqId, 5);
    return header;
  }

  $getReqId() {
    if (this.$req_id > 1000000)
      this.$req_id = 0;
    return this.$req_id++;
  }

  $shatransform(t) {
    return crypto.createHash('sha1').update(t).digest();
  }
}

module.exports = Connection;