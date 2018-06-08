const MongoClient = require('mongodb').MongoClient;                   //引入mongodb模块，获得客户端对象
const DB_CONN_STR = require('../config').database;
const uuid = require('node-uuid');
const ERROR = require('../model/ERROR');    // 错误编码
const Socket = require('./sokcet');
const Doc = require('./doc');
const JSZip = require('jszip');
const fs = require('fs');

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
    showChildren: true,
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

// 创建项目
function create(projectName, userId, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('projects');
    const emptyProject = new Project(projectName, userId);
    collection.insert(emptyProject, (err) => {
      closedb();
      if (err) callback && callback(ERROR.INSERT_FAIL);
      else insertProjectToUser({
        projectName: emptyProject.projectName,
        projectId: emptyProject.projectId,
        createTime: emptyProject.createTime,
        userId: emptyProject.userId,
      }, userId, callback);
    });
  });
}

// 删除项目
function drop (projectId, userId, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      connectToMongo((db, closedb) => {
        const collection = db.collection('projects');
        if (project.userId === userId || project.opUsers.filter((item) => item.id === userId).length !== 0){
          collection.remove({projectId: projectId}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.REMOVE_FAIL);
            else {
              for (let i = 0; i < project.files.length; i++) removeFilesInMongo(project.projectId, project.files[i]);
              removeProjectFromUser(project);
              callback && callback({code: ERROR.SUCCESS.code, msg: '删除项目成功'});
            }
          });
        } else {
          closedb();
          callback && callback(ERROR.PERMISSION_DENIED);
        }
      });
    }
  });
}

function removeProjectFromUser(project, userId) {
  project.opUsers.push({id: project.userId});
  const users = userId ? [{id: userId}] : project.opUsers;
  connectToMongo((db, closedb) => {
    const collection = db.collection('users');
    let finish = 0;
    for (let i = 0; i < users.length; i++) {
      collection.find({id: users[i].id}).toArray((err, res) => {
        for(let i = 0; i < res[0].selfProjects.length; i++) {
          if (res[0].selfProjects[i].projectId === project.projectId) { res[0].selfProjects.splice(i, 1); break; }
        }
        for(let i = 0; i < res[0].joinProjects.length; i++) {
          if (res[0].joinProjects[i].projectId === project.projectId) { res[0].joinProjects.splice(i, 1); break; }
        }
        collection.updateMany({id: users[i].id}, {$set: {selfProjects: res[0].selfProjects, joinProjects: res[0].joinProjects}}, () => {
          Socket.notifyUser(users[i].id, JSON.stringify({type: 'project', op: 'delete', project: project}));
          finish++;
          if(finish === users.length) closedb();
        });
      });
    }
  });
}

// 下载项目
function download (projectId, callback) {
  get(projectId, (res) => {
    if(!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const zip = new JSZip();
      const project = res.project;
      Doc.getDocsByCollectionName(projectId, (data) => {
        const docs = data.docs;
        addFilesToZip(zip, project.files, '', docs);
        zip.generateAsync({type: 'string', base64: false, compression: 'DEFLATE'}).then((content) => {
          callback && callback({ code: ERROR.SUCCESS.code, content: content, zipName: project.projectName });
        });
      });
    }
  });
}

function addFilesToZip (zip, files, path, docs) {
  for( let i = 0; i < files.length; i++) {
    if (files[i].children && files[i].children.length > 0)  addFilesToZip(zip, files[i].children, `${path}${files[i].name}/`, docs);
    else if (files[i].children && files[i].children.length === 0) zip.folder(`${path}${files[i].name}`);
    else {
      const doc = docs.filter((item) => item.id === files[i].id)[0];
      if (doc) zip.file(`${path}${files[i].name}`, doc.value);
    }
  }
}

// 项目重命名
function rename (projectId, userId, projectName, username, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      const oName = project.projectName;
      connectToMongo((db, closedb) => {
        const collection = db.collection('projects');
        if (project.userId === userId || project.opUsers.filter((item) => item.id === userId).length !== 0) {
          project.projectName = projectName;
          collection.updateMany({projectId: projectId},{$set:{projectName:projectName}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else {
              updateProjectNameInUser(username, oName, project);
              callback && callback({code: ERROR.SUCCESS.code, msg: '项目重命名成功', project: project});
            }
          });
        } else {
          closedb();
          callback && callback(ERROR.PERMISSION_DENIED);
        }
      });
    }
  });
}

function updateProjectNameInUser (username, oName, project) {
  project.opUsers.push({id: project.userId});
  const users = project.opUsers;
  connectToMongo((db, closedb) => {
    const collection = db.collection('users');
    let finish = 0;
    for (let i = 0; i < users.length; i++) {
      collection.find({id: users[i].id}).toArray((err, res) => {
        const selfProject = res[0].selfProjects.filter((item) => item.projectId === project.projectId)[0];
        const joinProject = res[0].joinProjects.filter((item) => item.projectId === project.projectId)[0];
        if(selfProject)selfProject.projectName = project.projectName;
        if(joinProject)joinProject.projectName = project.projectName;
        collection.updateMany({id: users[i].id}, {$set: {selfProjects: res[0].selfProjects, joinProjects: res[0].joinProjects}}, () => {
          Socket.notifyUser(users[i].id, JSON.stringify({type: 'project', op: 'update', project: project, msg: `${username}将项目${oName}重命名为${project.projectName}`}));
          finish++;
          if(finish === users.length) closedb();
        });
      });
    }
  });
}

// 获取项目信息
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

// 创建文件
function createFile (projectId, fileName, type, fatherId, username, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
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
            else if(type === 1){
              project.files = projectFiles;
              Socket.updateProject(projectId, project, `${username}创建了文件${fileName}`);
              Doc.create(projectId, file.id, (data) => {
                data.files = projectFiles;
                callback && callback(data);
              });
            } else {
              project.files = projectFiles;
              Socket.updateProject(projectId, project, `${username}创建了文件夹${fileName}`);
              callback && callback ({code: ERROR.SUCCESS.code, msg: '文件夹创建成功', files: projectFiles});
            }
          });
        });
      }
    }
  });
}

// 文件重命名
function renameFile (projectId, fileId, name, username, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      const projectFiles = res.project.files.concat();
      const oName = getFileName(projectFiles, fileId);
      const canRename = renameInFiles(projectFiles, fileId, name);
      if (!canRename) callback && callback(ERROR.UPDATE_FAIL);
      else {
        connectToMongo((db, closedb) => {
          const collection = db.collection('projects');
          collection.updateMany({projectId: projectId}, {$set: {files: projectFiles}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else {
              project.files = projectFiles;
              Socket.updateProject(projectId, project, `${username}将文件${oName}改名为${name}`);
              callback && callback({code: ERROR.SUCCESS.code, msg: '文件重命名成功', files: projectFiles});
            }
          });
        });
      }
    }
  });
}

// 删除文件
function removeFile (projectId, fileId, username, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      const projectFiles = res.project.files.concat();
      const oName = getFileName(projectFiles, fileId);
      const canRemove = removeFromFiles(projectId, projectFiles, fileId);
      if (!canRemove) callback && callback(ERROR.UPDATE_FAIL);
      else {
        connectToMongo((db, closedb) => {
          const collection = db.collection('projects');
          collection.updateMany({projectId: projectId}, {$set: {files: projectFiles}}, (err, res) => {
            closedb();
            if (err) callback && callback(ERROR.UPDATE_FAIL);
            else {
              project.files = projectFiles;
              Socket.updateProject(projectId, project, `${username}删除文件${oName}`);
              callback && callback({code: ERROR.SUCCESS.code, msg: '删除文件成功', files: projectFiles});
            }
          });
        });
      }
    }
  });
}

// 邀请用户
function inviteUser (projectId, username, owername, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      connectToMongo((db, closedb) => {
        const collection = db.collection('users');
        collection.find({name: username}).toArray((err, res) => {
          if (err) {closedb(); callback && callback(ERROR.FIND_FAIL);}
          else if(res.length === 0) {closedb();callback && callback(ERROR.USER_NOT_EXIST);}
          else if(project.userId === res[0].id || project.opUsers.filter((item) => item.id === res[0].id).length !== 0) callback && callback(ERROR.USER_ALREADY_IN_PROJECT);
          else{
            const toUserId = res[0].id;
            const nInvitedProjects =  res[0].invitedProjects.concat();
            if (nInvitedProjects.filter((item) => { return item.projectId === projectId; }).length === 0) nInvitedProjects.push({
              projectId: project.projectId,
              projectName: project.projectName,
              createTime: project.createTime,
              userId: project.userId,
              username: owername
            });
            collection.updateMany({name: username}, {$set: {invitedProjects: nInvitedProjects}}, (err) => {
              closedb();
              if (err) callback && callback(ERROR.UPDATE_FAIL);
              else {
                Socket.notifyUser(toUserId, JSON.stringify({type: 'notification', invitedProjects:nInvitedProjects, msg:  `收到来自${owername}的项目邀请`}));
                callback && callback({code: ERROR.SUCCESS.code, msg: '邀请成功'});
              }
            });
          }
        });
      });
    }
  });
}

// 移除用户
function removeUser (projectId, userId, callback) {
  get(projectId, (res) => {
    if (!res.project) callback && callback(ERROR.PROJECT_NOT_EXIST);
    else {
      const project = res.project;
      connectToMongo((db, closedb) => {
        const collection = db.collection('projects');
        for (let i = 0; i < project.opUsers.length; i++) {
          if (project.opUsers[i].id === userId) { project.opUsers.splice(i, 1); break; }
        }
        collection.updateMany({projectId: projectId}, {$set: {opUsers: project.opUsers}}, (err, res) => {
          closedb();
          if (err) callback && callback(ERROR.UPDATE_FAIL);
          else {
            callback && callback({code: ERROR.SUCCESS.code, msg: '移除用户成功'});
            Socket.notifyUser(userId, JSON.stringify({type: 'notification', msg:  `您已被管理员移除项目${project.projectName}`}));
            removeProjectFromUser(project, userId);
          }
        });
      });
    }
  });
}

// 将项目添加到用户的项目列表中
function insertProjectToUser (project, userId, callback) {
  connectToMongo((db, closedb) => {
    const collection = db.collection('users');
    collection.find({id: userId}).toArray((err, res) => {
      if (err) { closedb(); callback && callback(ERROR.FIND_FAIL); }
      else if (res.length === 0) {closedb(); callback && callback(ERROR.USER_NOT_EXIST);}
      else {
        const nProjects = res[0].selfProjects.concat();
        nProjects.push(project);
        collection.updateMany({id: userId},{$set:{selfProjects:nProjects}}, (err, res) => {
          closedb();
          if (err) callback && callback(ERROR.UPDATE_FAIL);
          else callback && callback({code: ERROR.SUCCESS.code, msg: '项目创建成功', selfProjects: nProjects, project: project});
        });
      }
    });
  });
}

// 文件排序
function sortFiles(files) {
  files.sort((a, b) => {
    if (a.children && !b.children) return false;
    else if (!a.children && b.children) return true;
    else return a.name > b.name;
  });
}

// 添加新文件到文件数组
function addToFiles (files, file, id) {
  if (id === '-1') {
    files.push(file);
    sortFiles(files);
    return true;
  }
  let find = false;
  for (let i = 0; i < files.length; i++) {
    if(files[i].children && files[i].id === id) {
      files[i].children.push(file);
      sortFiles(files[i].children);
      return true;
    } else if(files[i].children) {
      find = find || addToFiles(files[i].children, file, id);
      if (find) return true;  // 减枝
    }
  }
  return find;
}

// 从文件数组中删除指定文件
function removeFromFiles (projectId, files, id) {
  let find = false;
  for (let i = 0;i < files.length; i++) {
    if (files[i].id === id) {
      removeFilesInMongo(projectId, files[i]);
      files.splice(i, 1);
      return true;
    } else if (files[i].children) {
      find = find || removeFromFiles(projectId, files[i].children, id);
      if (find) return true;
    }
  }
  return find;
}

// 批量从数据库删除文件
function removeFilesInMongo (collectionName, files) {
  if (!files.children) Doc.deleteDoc(collectionName, files.id);
  else {
    for (let i = 0; i < files.children.length; i++) {
      removeFilesInMongo(collectionName, files.children[i]);
    }
  }
}

// 文件重命名
function renameInFiles (files, id, name) {
  let find = false;
  for (let i = 0;i < files.length; i++) {
    if (files[i].id === id) {
      files[i].name = name;
      return true;
    } else if (files[i].children) {
      find = find || renameInFiles(files[i].children, id, name);
      if (find) return true;
    }
  }
  return find;
}

function getFileName(files, id) {
  let find = false;
  for (let i = 0;i < files.length; i++) {
    if (files[i].id === id) {
      return files[i].name;
    } else if (files[i].children) {
      find = find || getFileName(files[i].children, id);
      if (find) return find;
    }
  }
  return find;
}

module.exports = {
  create,
  drop,
  get,
  download,
  rename,
  createFile,
  removeFile,
  renameFile,
  inviteUser,
  removeUser
};
