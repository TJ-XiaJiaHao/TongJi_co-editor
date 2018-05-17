// 访问路径：/docs/*，在app.js中定义
const express = require('express');         // express框架
const url = require('url');                 // url模块
const ERROR = require('../model/ERROR');    // 错误码
const Project = require('../dao/project');  // 数据访问对象
const router = express.Router();            // 路由

router.get('/', (req, res) => {
  res.send('request path: /projects/');
});

// 创建新项目
router.post('/create', (req, res) => {
  const projectName = req.body.projectName;
  const userId = req.body.userId;
  if(!projectName || !userId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.create(projectName, userId, (data) => { res.json(data); });
});

// 删除项目
router.post('/delete', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.body.userId;
  if(!projectId || !userId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.drop(projectId, userId, (data) => { res.json(data); });
});

// 项目重命名
router.post('/rename', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.body.userId;
  const projectName = req.body.projectName;
  if(!projectId || !userId || !projectName) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.rename(projectId, userId, projectName, (data) => { res.json(data); });
});

// 项目详细信息
router.get('/details', (req, res) => {
  const projectId =  url.parse(req.url, true).query.projectId;
  if(!projectId ) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.get(projectId, (data) => { res.json(data); });
});

router.post('/createFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderName = req.body.folderName;
  const fatherId = req.body.fatherId;
  if(!projectId || !folderName || !fatherId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.createFile(projectId, folderName, 0, fatherId, (data) => { res.json(data); });
});

router.post('/createFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileName = req.body.fileName;
  const fatherId = req.body.fatherId;
  if(!projectId || !fileName || !fatherId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.createFile(projectId, fileName, 1, fatherId, (data) => { res.json(data); });
});

router.post('/deleteFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderId = req.body.folderId;
  if(!projectId || !folderId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.removeFile(projectId, folderId, (data) => { res.json(data); });
});

router.post('/deleteFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileId = req.body.fileId;
  if(!projectId || !fileId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.removeFile(projectId, fileId, (data) => { res.json(data); });
});

router.post('/renameFolder', (req, res) => {
  const projectId = req.body.projectId;
  const folderId = req.body.folderId;
  const folderName = req.body.folderName;
  if(!projectId || !folderId || !folderName) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.renameFile(projectId, folderId, folderName, (data) => { res.json(data); });
});

router.post('/renameFile', (req, res) => {
  const projectId = req.body.projectId;
  const fileId = req.body.fileId;
  const fileName = req.body.fileName;
  if(!projectId || !fileId || !fileName) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.renameFile(projectId, fileId, fileName, (data) => { res.json(data); });
});

router.get('/addUser', (req, res) => {
  const projectId = req.body.projectId;
})
module.exports = router;