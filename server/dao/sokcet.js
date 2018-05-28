const WebSocket = require('ws');
const WebSocketJSONStream = require('websocket-json-stream');
const sockets = [];
const backend = require('./doc').backend;

function initWS(server) {
  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});

  // 监听新的客户端的websocket请求，并把请求交给sharedb处理
  wss.on('connection', function(ws) {
    const stream = new WebSocketJSONStream(ws);

    // ShareDB 的前后端通信的数据以 JSON 格式传输
    // 服务端收到数据后，需要将数据从 JSON 转换为 Object
    // 并通过放入 stream 的缓存区 (push)，交给 ShareDB 处理
    ws.on('message', function(msg) {
      const jsonMsg = JSON.parse(msg);
      if (jsonMsg.type === 'connect') createSocket(ws, jsonMsg);
      else if (jsonMsg.type === 'doc') switchDoc(jsonMsg);
      else stream.push(JSON.parse(msg));
    });

    backend.listen(stream);
  });
}

function updateProject (projectId, project, msg){
  const users = sockets.filter((item) => item.projectId === projectId);
  for (let i = 0; i < users.length; i++){
    users[i].ws.readyState === WebSocket.OPEN && users[i].ws.send(JSON.stringify({type: 'project', op: 'update', project: project, msg: msg}));
  }
}

function switchDoc (msg) {
  const user = sockets.filter((item) => item.userId === msg.userId)[0];
  if (!user) return;
  const oDocId = user.docId;
  const oJoins = oDocId === '' ? [] : sockets.filter((item) => item.docId === oDocId);
  const nJoins = msg.docId === '' ? [] : sockets.filter((item) => item.docId === msg.docId);
  user.docId = msg.docId;
  user.userName = msg.userName;

  for ( let i = 0; i < oJoins.length; i++) {
    user.ws.readyState === WebSocket.OPEN && user.ws.send(JSON.stringify({type: 'doc', op: 'out', userId: oJoins[i].userId, userName: oJoins[i].userName}));
    oJoins[i].ws.readyState === WebSocket.OPEN && oJoins[i].ws.send(JSON.stringify({type: 'doc', op: 'out', userId: msg.userId, msg: oJoins[i].userId === msg.userId ? null :`用户${msg.userName}退出编辑`}));
  }
  for ( let i = 0; i < nJoins.length; i++) {
    user.ws.readyState === WebSocket.OPEN && user.ws.send(JSON.stringify({type: 'doc', op: 'join', userId: nJoins[i].userId, userName: nJoins[i].userName}));
    nJoins[i].ws.readyState === WebSocket.OPEN && nJoins[i].ws.send(JSON.stringify({type: 'doc', op: 'join', userId: msg.userId, userName: msg.userName, msg: `用户${msg.userName}加入编辑`}));
  }
}

function switchProject (userId, projectId) {
  const user = sockets.filter((item) => item.userId === userId)[0];
  if (user) user.projectId = projectId;
}

function createSocket (ws, msg) {
  ws.on('close', () => {
    closeSocket(msg.userId);
  });
  const user = sockets.filter((item) => item.userId === msg.userId)[0];
  if (user) user.ws = ws;
  else sockets.push({userId: msg.userId, ws: ws, projectId: '', docId: ''});
}

function closeSocket (userId) {
  for ( let i = 0; i < sockets.length; i++) {
    if (sockets[i].userId === userId) {
      switchDoc({
        userId: userId,
        docId: ''
      });
      sockets.splice(i, 1);
      break;
    }
  }
}

function notifyUser (userId, msg) {
  const user = sockets.filter((item) => { return item.userId === userId; })[0];
  if(user) {
    user.ws.readyState === WebSocket.OPEN && user.ws.send(msg);
  }
}
module.exports = {
  initWS,
  notifyUser,
  switchProject,
  updateProject
};