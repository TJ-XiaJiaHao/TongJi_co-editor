const MongoClient = require('mongodb').MongoClient;                   //引入mongodb模块，获得客户端对象
const DB_CONN_STR = 'mongodb://115.159.215.48:27017/COEDITOR';        //连接字符串
const uuid = require('node-uuid');
const ERROR = require('../model/ERROR');    // 错误编码

function connectToMongo (callback) {
  //使用客户端连接数据，并指定完成时的回调方法
  MongoClient.connect(DB_CONN_STR, function(err, db) {
    //执行插入数据操作，调用自定义方法
    callback(db, () => {
      db.close();
    });
  });
}
function Project (projectName, userId) {
  return {
    projectName: projectName,
    projectId: uuid.v1(),
    createTime: Date.now(),
    userId: userId,
    opUsers: [],          // 可进行操作的用户，如删除、改名等
    files: []
  };
}

function Folder (name) {
  return {
    name: name,
    id: uuid.v1(),
    children: [],
    createTime: Date.now()
  };
}

function File (name) {
  return {
    name: name,
    id: uuid.v1(),
    createTime: Date.now()
  };
}

function create(projectName, userId, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('projects');
    const emptyProject = new Project(projectName, userId);
    collection.insert(emptyProject, (err) => {
      closedb();
      if (err) callback && callback(ERROR.INSERT_FAIL);
      callback && callback({
        code: ERROR.SUCCESS.code,
        msg: '创建项目成功',
        project: emptyProject
      });
    });
  });
}

function drop (projectId, userId, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      connectToMongo((db, closedb) => {
        const collection = db.collection('projects');
        if (project.userId === userId || project.opUsers.indexOf(userId) > 0){
          collection.remove({projectId: projectId}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.REMOVE_FAIL);
            else callback && callback({code: ERROR.SUCCESS.code, msg: '删除项目成功'});
          });
        } else {
          closedb();
          callback && callback(ERROR.PERMISSION_DENIED);
        }
      });
    }
  });
}

function get (projectId, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('projects');
    collection.find({projectId: projectId}).toArray((err, res) => {
      closedb();
      if (err) callback && callback(ERROR.FIND_FAIL);
      else callback && callback({
        code: ERROR.SUCCESS.code,
        msg: '',
        project: res.length > 0 ? res[0] : null
      });
    });
  });
}

function rename (projectId, userId, projectName, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      connectToMongo((db, closedb) => {
        const collection = db.collection('projects');
        if (project.userId === userId || project.opUsers.indexOf(userId) > 0) {
          collection.updateMany({projectId: projectId},{$set:{projectName:projectName}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else callback && callback({code: ERROR.SUCCESS.code, msg: '项目重命名成功'});
          });
        } else {
          closedb();
          callback && callback(ERROR.PERMISSION_DENIED);
        }
      });
    }
  });
}

function addToFiles (files, file, id) {
  if (id === '-1') {
    files.push(file);
    return true;
  }
  let find = false;
  for (let i = 0; i < files.length; i++) {
    if(files[i].children && files[i].id === id) {
      files[i].children.push(file);
      return true;
    } else if(files[i].children) {
      find = find || addToFiles(files[i].children, file, id);
      if (find) return true;  // 减枝
    }
  }
  return find;
}

function removeFromFiles (files, id) {
  let find = false;
  for (let i = 0;i < files.length; i++) {
    if (files[i].id === id) {
      files.splice(i, 1);
      return true;
    } else if (files[i].children) {
      find = find || removeFromFiles(files[i].children, id);
      if (find) return true;
    }
  }
  return find;
}

function renameInFiles (files, id, name) {
  let find = false;
  for (let i = 0;i < files.length; i++) {
    if (files[i].id === id) {
      files[i].name = name;
      return true;
    } else if (files[i].children) {
      find = find || removeFromFiles(files[i].children, id);
      if (find) return true;
    }
  }
  return find;
}

function createFile (projectId, fileName, type, fatherId, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const projectFiles = res.project.files.concat();
      const file = type === 0 ? new Folder(fileName) : new File(fileName);
      const canAdd = addToFiles(projectFiles, file, fatherId);
      if(!canAdd) callback && callback(ERROR.UPDATE_FAIL);
      else {
        connectToMongo((db, closedb) => {
          const collection = db.collection('projects');
          collection.updateMany({projectId: projectId},{$set:{files:projectFiles}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else callback && callback({code: ERROR.SUCCESS.code, msg: '创建文件成功', files: projectFiles});
          });
        });
      }
    }
  });
}

function renameFile (projectId, fileId, name, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const projectFiles = res.project.files.concat();
      const canRename = renameInFiles(projectFiles, fileId, name);
      if (!canRename) callback && callback(ERROR.UPDATE_FAIL);
      else {
        connectToMongo((db, closedb) => {
          const collection = db.collection('projects');
          collection.updateMany({projectId: projectId}, {$set: {files: projectFiles}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else callback && callback({code: ERROR.SUCCESS.code, msg: '文件重命名成功', files: projectFiles});
          });
        });
      }
    }
  });
}

function removeFile (projectId, fileId, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const projectFiles = res.project.files.concat();
      const canRemove = removeFromFiles(projectFiles, fileId);
      if (!canRemove) callback && callback(ERROR.UPDATE_FAIL);
      else {
        connectToMongo((db, closedb) => {
          const collection = db.collection('projects');
          collection.updateMany({projectId: projectId}, {$set: {files: projectFiles}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else callback && callback({code: ERROR.SUCCESS.code, msg: '删除文件成功', files: projectFiles});
          });
        });
      }
    }
  });
}

module.exports = {
  create,
  drop,
  get,
  rename,
  createFile,
  removeFile,
  renameFile
};
