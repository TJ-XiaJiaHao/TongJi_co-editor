const ERROR = require('../model/ERROR');
const db = require('sharedb-mongo')('mongodb://115.159.215.48:27017/COEDITOR');
const ShareDB = require('sharedb');
const backend = new ShareDB({db});
const connection = backend.connect();
const WebSocket = require('ws');
const WebSocketJSONStream = require('websocket-json-stream');

function Doc(doc) {
  return {
    id: doc.id,
    collection: doc.collection,
    value: doc.data.document.value
  };
}

function initWS(server) {
// Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws, req) {
    console.log('new websocket connection: ', ws, req);
    const stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });
}

function create(collectionName, documentId, callback) {
  const doc = connection.get(collectionName, documentId);
  doc.fetch((err) => {
    if(err) callback && callback(ERROR.MONGO_ERROR);
    // 如果文件已经存在，则不重复创建
    else if(doc.type) callback && callback(ERROR.FILE_EXIST);

    // 如果文件不存在，则新建文件
    else doc.create({document: {value: ''}}, (err) => {
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

function deleteCollection(collectionName, callback) {

}

// 同步所有编辑者的文件
function syncDoc() {

}
module.exports = {
  create,
  update,
  getDocsByCollectionName,
  deleteDoc,
  deleteCollection,
  initWS,
};