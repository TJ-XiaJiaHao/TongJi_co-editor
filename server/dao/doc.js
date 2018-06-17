const config = require('../config');
const ERROR = require('../model/ERROR');    // 错误编码
const db = require('sharedb-mongo')(config.database);   // mongodb
const ShareDB = require('sharedb');   // sharedb
const otText = require('ot-text');    // ot-text, 一种sharedb支持的类型

// ShareDB 可以支持多种 OT 类型，例如 JSON 文本，普通文本，富文本等
// 具体文档可以查看 https://github.com/ottypes/docs
// 这里使用普通文本类型 ot-text
ShareDB.types.register(otText.type);

const backend = new ShareDB({db});    // sharedb实例
const connection = backend.connect();

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
    else doc.create('', 'text', (err) => {
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
  backend
};