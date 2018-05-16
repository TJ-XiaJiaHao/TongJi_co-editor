// 访问路径：/docs/*，在app.js中定义
const express = require('express');         // express框架
const url = require('url');                 // url模块
const ERROR = require('../model/ERROR');    // 错误码
const Doc = require('../dao/doc');          // 数据访问对象
const router = express.Router();            // 路由

router.get('/', (req, res) => {
  res.send('request path: /docs/');
});

// 创建新文件 {POST}
router.post('/create', (req, res) => {
  const projectID = req.body.projectID;
  const docID = req.body.docID;
  if(!projectID || !docID) res.json(ERROR.ARGUMENTS_ERROR);
  else Doc.create(projectID, docID, (data) => { res.json(data); });
});

// 更新文件 {POST}
router.post('/update', (req, res) => {
  const projectID = req.body.projectID;
  const docID = req.body.docID;
  const document = req.body.document || '';
  if(!projectID || !docID)  res.json(ERROR.ARGUMENTS_ERROR);
  else Doc.update(projectID, docID, document, (data) => { res.json(data); });
});

// 获取所有文件 {GET}
router.get('/getAllDocs', (req, res) => {
  const projectID = url.parse(req.url, true).query.projectID;
  if(!projectID) res.json(ERROR.ARGUMENTS_ERROR);
  else Doc.getDocsByCollectionName(projectID, (data) => { res.json(data); });
});

// 删除文档
router.post('/deleteDoc', (req, res) => {
  const projectID = req.body.projectID;
  const docID = req.body.docID;
  if(!projectID || !docID) res.json(ERROR.ARGUMENTS_ERROR);
  else Doc.deleteDoc(projectID, docID, (data) => { res.json(data); });
});

module.exports = router;