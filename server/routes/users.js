// 访问路径：/users/*

const express = require('express');
const router = express.Router();
const ERROR = require('../model/ERROR');    // 错误码
const User = require('../dao/user');  // 数据访问对象

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password) res.json(ERROR.ARGUMENTS_ERROR);
  else User.register(username, password, (data) => { if (data.code === 0) req.session.user = data.user; res.json(data); });
});

router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password) res.json(ERROR.ARGUMENTS_ERROR);
  else User.login(username, password, (data) => { if (data.code === 0) req.session.user = data.user; res.json(data); });
});

router.get('/getUserInfo', (req, res) => {
  if (req.session.user) {
    res.json({
      code: ERROR.SUCCESS.code,
      user: req.session.user
    });
  } else res.json(ERROR.USER_NOT_LOGIN);
});

module.exports = router;
