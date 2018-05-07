
module.exports = {
  SUCCESS: {code: 0, msg: ''},
  ARGUMENTS_ERROR: {code: 1000, msg: '参数错误'},
  FILE_EXIST: {code:1001, msg: '文件已经存在'},
  FILE_NOT_EXIST : {code: 1002, msg: '文件不存在'},
  MONGO_ERROR: {code: 1003, msg:'连接数据库失败'},
  CREATE_FILE_FAIL: {code: 2001, msg: '文件创建失败'},
  UPDATE_FILE_FAIL: {code: 2002, msg: '文件更新失败'},
  GET_FILE_FAIL: {code: 2003, msg:'获取文件失败'},
  DELETE_FILE_FAIL: {code: 2004,msg:'删除文件失败'},
}