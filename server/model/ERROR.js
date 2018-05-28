
module.exports = {
  SUCCESS: {code: 0, msg: ''},
  ARGUMENTS_ERROR: {code: 1000, msg: '参数错误'},
  FILE_EXIST: {code:1001, msg: '文件已经存在'},
  FILE_NOT_EXIST : {code: 1002, msg: '文件不存在'},
  MONGO_ERROR: {code: 1003, msg:'连接数据库失败'},
  LOGIN_FAIL: {code: 1004, msg:'登陆失败'},
  USER_EXIST: {code: 1005, msg:'用户已存在'},
  USER_NOT_LOGIN: {code: 1006, msg:'用户未登录'},
  USER_NOT_EXIST: {code: 1007, msg:'用户不存在'},
  USER_ALREADY_IN_PROJECT: {code: 1008, msg:'该用户已经是该项目成员'},
  CREATE_FILE_FAIL: {code: 2001, msg: '文件创建失败'},
  UPDATE_FILE_FAIL: {code: 2002, msg: '文件更新失败'},
  GET_FILE_FAIL: {code: 2003, msg:'获取文件失败'},
  DELETE_FILE_FAIL: {code: 2004,msg:'删除文件失败'},
  PERMISSION_DENIED: {code: 2005,msg:'权限不足'},
  INSERT_FAIL: {code: 2100, msg: '数据插入失败'},
  FIND_FAIL: {code: 2101, msg: '数据查询失败'},
  REMOVE_FAIL: {code: 2102, msg: '数据删除失败'},
  UPDATE_FAIL: {code: 2103, msg: '数据更新失败'},
  PROJECT_NOT_EXIST: {code: 2200, msg: '项目不存在'}
};