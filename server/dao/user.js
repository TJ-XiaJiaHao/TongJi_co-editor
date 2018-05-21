const MongoClient = require('mongodb').MongoClient;                   //引入mongodb模块，获得客户端对象
const DB_CONN_STR = 'mongodb://115.159.215.48:27017/COEDITOR';        //连接字符串
const uuid = require('node-uuid');
const ERROR = require('../model/ERROR');    // 错误编码

function User (name, pwd) {
  return {
    name: name,
    password: pwd,
    id: uuid.v1(),
    selfProjects: [],
    joinProjects: [],
    lastProjectId: ''
  };
}

function connectToMongo (callback) {
  //使用客户端连接数据，并指定完成时的回调方法
  MongoClient.connect(DB_CONN_STR, function(err, db) {
    //执行插入数据操作，调用自定义方法
    callback(db, () => {
      db.close();
    });
  });
}

function register (name, pwd, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('users');
    collection.find({name: name}).toArray((err, res) => {
      if (err) { closedb(); callback && callback(ERROR.FIND_FAIL);}
      else if (res.length !== 0) { closedb(); callback && callback (ERROR.USER_EXIST);}
      else {
        const emptyUser = new User(name, pwd);
        collection.insert(emptyUser, (err) => {
          closedb();
          if (err) callback && callback(ERROR.INSERT_FAIL);
          callback && callback({
            code: ERROR.SUCCESS.code,
            msg: '用户注册成功',
            user: {
              id: emptyUser.id,
              name: emptyUser.name,
              selfProjects: emptyUser.selfProjects,
              joinProjects: emptyUser.joinProjects
            }
          });
        });
      }
    });
  });
}
function login (name, pwd, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('users');
    collection.find({name: name, password: pwd}).toArray((err, res) => {
      closedb();
      if (err) callback && callback(ERROR.FIND_FAIL);
      else if (res.length === 0) callback && callback (ERROR.LOGIN_FAIL);
      else callback && callback({
          code: ERROR.SUCCESS.code,
          msg: '',
          user: {
            name: res[0].name,
            id: res[0].id,
            selfProjects: res[0].selfProjects,
            joinProjects: res[0].joinProjects
          }
        });
    });
  });
}

module.exports = {
  register,
  login
};