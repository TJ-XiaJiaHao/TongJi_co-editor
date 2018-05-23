const ERROR = require('../model/ERROR');    // 错误编码
const db = require('sharedb-mongo')('mongodb://115.159.215.48:27017/COEDITOR');   // mongodb
const ShareDB = require('sharedb');   // sharedb
const otText = require('ot-text');    // ot-text, 一种sharedb支持的类型
const WebSocket = require('ws');
const WebSocketJSONStream = require('websocket-json-stream');

// ShareDB 可以支持多种 OT 类型，例如 JSON 文本，普通文本，富文本等
// 具体文档可以查看 https://github.com/ottypes/docs
// 这里使用普通文本类型 ot-text
ShareDB.types.register(otText.type);

const backend = new ShareDB({db});    // sharedb实例
const connection = backend.connect();

const fsSockets = [];
const userSockets = [];

function initWS(server) {
// Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});

  // 监听新的客户端的websocket请求，并把请求交给sharedb处理
  wss.on('connection', function(ws) {
    const stream = new WebSocketJSONStream(ws);

    // ShareDB 的前后端通信的数据以 JSON 格式传输
    // 服务端收到数据后，需要将数据从 JSON 转换为 Object
    // 并通过放入 stream 的缓存区 (push)，交给 ShareDB 处理
    ws.on('message', function(msg) {
      if (JSON.parse(msg).type === 'fs') processFSSocket(ws, JSON.parse(msg));
      else if(JSON.parse(msg).type === 'user') processUserSocket(ws, JSON.parse(msg));
      else stream.push(JSON.parse(msg));
    });

    backend.listen(stream);
  });
}

function notifyUser (userId, msg) {
  const user = userSockets.filter((item) => { return item.userId === userId; })[0];
  if(user) {
    user.ws.readyState === WebSocket.OPEN && user.ws.send(msg);
  }
}

function processUserSocket (ws, msg) {
  const user = userSockets.filter((item) => { return item.userId === msg.id; })[0];
  if (!user) userSockets.push({
    userId: msg.id,
    ws: ws
  });
  else user.ws = ws;
}

function processFSSocket(ws, msg) {
  const fs = fsSockets.filter((item) => {return item.id === msg.id; })[0];
  if (fs) {
    if (msg.op === 'init') {
      fs.wss.push(ws);
    } else if (msg.op === 'close') {
      for (let i = 0; i < fs.wss.length; i++) {
        if (fs.wss[i] === ws) {
          fs.wss.splice(i, 1);
          break;
        }
      }
    }else if (msg.op === 'update') {
      for (let i = 0; i < fs.wss.length; i++) {
        fs.wss[i].readyState === WebSocket.OPEN && fs.wss[i].send(JSON.stringify({type: 'fs', project: msg.project}));
      }
    }
  } else {
    fsSockets.push({
      id: msg.id,
      wss: [ws]
    });
  }
}

function Doc(doc) {
  return {
    id: doc.id,
    collection: doc.collection,
    value: doc.data
  };
}

function create(collectionName, documentId, callback) {
  const doc = connection.get(collectionName, documentId);
  doc.fetch((err) => {
    if(err) callback && callback(ERROR.MONGO_ERROR);
    // 如果文件已经存在，则不重复创建
    else if(doc.type) callback && callback(ERROR.FILE_EXIST);

    // 如果文件不存在，则新建文件
    // else doc.create({document: {value: ''}}, (err) => {
    else doc.create('This is a new document', 'text', (err) => {
      if(err) callback && callback(ERROR.CREATE_FILE_FAIL);
      else callback && callback({
        code: ERROR.SUCCESS.code,
        msg: '文件创建成功',
        doc: new Doc(doc)
      });
    });
  });
}

function update(collectionName, documentId, value, callback) {
  const doc = connection.get(collectionName, documentId);
  doc.fetch((err) => {
    if(err) callback && callback(ERROR.MONGO_ERROR);
    else if(doc.type){
      doc.submitOp([{p:['document', 'value'], od: '', oi: value}], (err) => {
       if(err) callback && callback(ERROR.UPDATE_FILE_FAIL);
       else callback && callback({code: ERROR.SUCCESS.code, msg: '文件更新成功'});
      });
    }
    else callback && callback(ERROR.FILE_NOT_EXIST);
  });
}

function getDocsByCollectionName(collectionName, callback) {
  connection.createFetchQuery(collectionName, {}, {}, (err, results) => {
    if (err) callback && callback(ERROR.MONGO_ERROR);
    else {
      const docs = [];
      for (const index in results) {
        docs.push(new Doc(results[index]));
      }
      callback && callback({code: ERROR.SUCCESS.code, msg: '', docs: docs});
    }
  });
}

function deleteDoc(collectionName, documentId, callback) {
  const doc = connection.get(collectionName, documentId);
  doc.fetch((err) => {
    if (err) callback && callback(ERROR.MONGO_ERROR);
    else if(doc.type === null) callback && callback(ERROR.FILE_NOT_EXIST);
    else doc.del({}, (err) => {
      if(err) callback && callback(ERROR.DELETE_FILE_FAIL);
      else callback && callback({code:ERROR.SUCCESS.code, msg: '文件删除成功'});
    });
  })
}

module.exports = {
  create,
  update,
  getDocsByCollectionName,
  deleteDoc,
  initWS,
  notifyUser
};