// 访问路径：/projects/*，在app.js中定义
const express = require('express');         // express框架
const url = require('url');                 // url模块
const ERROR = require('../model/ERROR');    // 错误码
const Project = require('../dao/project');  // 数据访问对象
const Doc = require('../dao/doc');
const router = express.Router();            // 路由

router.get('/', (req, res) => {
  res.send('request path: /projects/');
});

// 创建新项目
router.post('/create', (req, res) => {
  const projectName = req.body.projectName;
  const userId = req.session.user ? req.session.user.id : null;
  if(!projectName) res.json(ERROR.ARGUMENTS_ERROR);
  else if (!userId) res.json(ERROR.USER_NOT_LOGIN);
  else Project.create(projectName, userId, (data) => { res.json(data); });
});

// 删除项目
router.post('/delete', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.session.user ? req.session.user.id : null;
  if(!projectId) res.json(ERROR.ARGUMENTS_ERROR);
  else if (!userId) res.json(ERROR.USER_NOT_LOGIN);
  else Project.drop(projectId, userId, (data) => { res.json(data); });
});

// 项目重命名
router.post('/rename', (req, res) => {
  const projectId = req.body.projectId;
  const projectName = req.body.projectName;
  const userId = req.session.user ? req.session.user.id : null;
  if(!projectId || !projectName) res.json(ERROR.ARGUMENTS_ERROR);
  else if (!userId) res.json(ERROR.USER_NOT_LOGIN);
  else Project.rename(projectId, userId, projectName, (data) => { res.json(data); });
});

// 获取项目详细信息
router.get('/details', (req, res) => {
  const projectId =  url.parse(req.url, true).query.projectId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId ) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.get(projectId, (data) => { res.json(data); });
});

// 创建文件夹
router.post('/createFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderName = req.body.folderName;
  const fatherId = req.body.fatherId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !folderName || !fatherId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.createFile(projectId, folderName, 0, fatherId, (data) => { res.json(data); });
});

// 创建文件
router.post('/createFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileName = req.body.fileName;
  const fatherId = req.body.fatherId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !fileName || !fatherId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.createFile(projectId, fileName, 1, fatherId, (data) => { res.json(data); });
});

// 删除文件夹
router.post('/deleteFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderId = req.body.folderId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !folderId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.removeFile(projectId, folderId, (data) => { res.json(data); });
});

// 删除文件
router.post('/deleteFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileId = req.body.fileId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !fileId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.removeFile(projectId, fileId, (data) => { res.json(data); });
});

// 文件夹重命名
router.post('/renameFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderId = req.body.folderId;
  const folderName = req.body.folderName;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !folderId || !folderName) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.renameFile(projectId, folderId, folderName, (data) => { res.json(data); });
});

// 文件重命名
router.post('/renameFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileId = req.body.fileId;
  const fileName = req.body.fileName;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !fileId || !fileName) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.renameFile(projectId, fileId, fileName, (data) => { res.json(data); });
});

router.post('/inviteUser', (req, res) => {
  const projectId = req.body.projectId;
  const username = req.body.username;
  const ower = req.session.user && req.session.user.name;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !username) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.inviteUser(projectId, username, ower, (data) => {
    if (data.code === 0) Doc.notifyUser(data.userId, JSON.stringify({type: 'notification'}));
    res.json(data);
  });
});

router.post('/removeUser', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.body.userId;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId || !userId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.removeUser(projectId, userId, (data) => { res.json(data); });
});

module.exports = router;