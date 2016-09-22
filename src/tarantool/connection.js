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