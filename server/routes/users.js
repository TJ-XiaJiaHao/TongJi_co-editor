// 访问路径：/users/*

const express = require('express');
const router = express.Router();
const ERROR = require('../model/ERROR');    // 错误码
const User = require('../dao/user');  // 数据访问对象

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 注册
router.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password) res.json(ERROR.ARGUMENTS_ERROR);
  else User.register(username, password, (data) => { if (data.code === 0) req.session.user = data.user; res.json(data); });
});

// 登陆
router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password) res.json(ERROR.ARGUMENTS_ERROR);
  else User.login(username, password, (data) => { if (data.code === 0) req.session.user = data.user; res.json(data); });
});

// 获取用户信息
router.get('/getUserInfo', (req, res) => {
  if (req.session.user) {
    User.getUserInfo(req.session.user.id, (data) => { res.json(data); });
  } else res.json(ERROR.USER_NOT_LOGIN);
});

router.post('/acceptInvite', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.session.user && req.session.user.id;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId) res.json(ERROR.ARGUMENTS_ERROR);
  else User.processInvite(projectId, userId, true, (data) => { res.json(data); });
});

router.post('/rejectInvite', (req, res) => {
  const projectId = req.body.projectId;
  const userId = req.session.user && req.session.user.id;
  if(req.session.user === null) res.json(ERROR.USER_NOT_LOGIN);
  else if(!projectId) res.json(ERROR.ARGUMENTS_ERROR);
  else User.processInvite(projectId, userId, false, (data) => { res.json(data); });
});

module.exports = router;
