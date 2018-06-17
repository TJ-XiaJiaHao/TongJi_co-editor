<template>
  <div class="ace">
    <vHeader :user="user" :host="host" :project="project" :coUsers="coUsers" :title="currentFileName"
             @changeProject="loadProject"
             @updateUserInfo="loadUserInfo"
             @updateProject="loadProject(project.projectId)"></vHeader>
    <div class="content">
      <div class="left">
        <vFileSystem :project = "project" @loadFile="loadFile" :host="host"></vFileSystem>
      </div>
      <div class="right">
        <editor class="editor"
                :content="editorConfig.content"
                :lang="editorConfig.lang"
                :theme="editorConfig.theme"
                :sync="true"
                height="100%"
                width="100%"> </editor>
      </div>
    </div>
  </div>
</template>
<script>
import vFileSystem from '@/components/v-filesystem.vue';      // 文件系统组件
import vHeader from '@/components/v-header.vue';              // 头部组件
import editor from 'ace-vue2';                                // 编辑器组件
import 'brace/mode/javascript';
import 'brace/mode/css';
import 'brace/theme/chrome';
import 'brace/theme/monokai';                                 // 编辑器主题
import sharedb from 'sharedb/lib/client';                     // sharedb客户端
import Websocket from 'ws';                                   // websocket库
import otText from 'ot-text';                                 // sharedb中存储的一种类型
import axios from 'axios';                                    // http协议库
import config from '@/config';

export default {
  components: {
    vFileSystem,
    vHeader,
    editor
  },
  data () {
    return {
      ace: null,                                        // ace编辑器实例
      doc: null,                                        // 当前正在编辑的文档
      project: {},                                      // 当前项目详细信息
      currentFileName: '',
      connection: null,                                 // sharedb连接\
      isEditorLoaded: false,                            // 编辑器是否加载完成
      editorLockTime: 0,
      editorConfig: {                                   // 编辑器配置
        content: '',
        lang: 'javascript',
        theme: 'chrome'
      },
      user: {},                                          // 用户信息
      coUsers: [],                                         // 共同协作的用户
      // host: 'http://115.159.215.48:3000',                     // 后端主机
      host: `http://${config.host}`,                     // 后端主机
      socket: null                                      // socket连接
    };
  },

  mounted () {
    // 编辑器初始化
    this.ace = this.$children[this.$children.length - 1].editor;          // 编辑器
    this.ace.session.on('change', (delta) => {    // 监听编辑器改动事件
      console.log(delta);
      if (this.editorLockTime !== 0) {
        this.editorLockTime--;
      } else if (!this.isEditorLoaded) {
      } else if (delta.action === 'insert') {
        this.add(delta.start.row, delta.start.column, delta.lines);
      } else if (delta.action === 'remove') {
        this.remove(delta.start.row, delta.start.column, delta.lines);
      }
    });

    // sharedb初始化
    sharedb.types.register(otText.type);          // 注册text类型
    const shareDBSocket = new WebSocket(`ws://${config.host}/`);
    this.connection = new sharedb.Connection(shareDBSocket);

    // socket初始化
    this.socket = new WebSocket(`ws://${config.host}/`);
    this.socket.onmessage = (res) => {
      console.log(res);
      const data = JSON.parse(res.data);
      if (data.type === 'project' && data.project) {
        if (data.op === 'update') {
          const sProject = this.user.selfProjects.filter((item) => item.projectId === data.project.projectId)[0];
          const jProject = this.user.joinProjects.filter((item) => item.projectId === data.project.projectId)[0];
          if (sProject) sProject.projectName = data.project.projectName;
          if (jProject) jProject.projectName = data.project.projectName;
          this.project = data.project;
          if (data.msg) {
            this.$Notice.info({ title: '通知', desc: data.msg });
          }
        } else if (data.op === 'delete') {
          this.doc = {};
          this.project = {};
          this.currentFileName = null;
          this.editorConfig.content = '';
          this.lockEditor();
          this.loadUserInfo();
        }
      } else if (data.type === 'doc') {
        if (data.op === 'out') {
          for (let i = 0; i < this.coUsers.length; i++) {
            if (this.coUsers[i].userId === data.userId) {
              this.coUsers.splice(i, 1);
              break;
            }
          }
        } else if (data.op === 'join') {
          const user = this.coUsers.filter((item) => item.userId === data.userId)[0];
          if (!user) this.coUsers.push({userId: data.userId, userName: data.userName});
        }
        if (data.msg) this.$Notice.info({ title: '通知', desc: data.msg });
      } else if (data.type === 'notification') {
        this.$Notice.info({ title: '通知', desc: data.msg });
        this.loadUserInfo();
        this.loadProject(this.project.projectId);
      }
    };

    axios.defaults.withCredentials = true;            // 配置axios自动设置cookie
    this.loadUserInfo();
  },

  methods: {
    // 加载项目内容
    loadProject (projectId) {
      if (!projectId) return;
      axios.get(`${this.host}/projects/details?projectId=${projectId}`).then((data) => {
        if (data.data.code === 0) this.project = data.data.project;
        else this.showError('项目加载失败');
      });
    },

    // 加载用户信息
    loadUserInfo () {
      axios.get(`${this.host}/users/getUserInfo`).then((res) => {
        if (res.data.code === 0) {
          this.user = res.data.user;
          this.socket.send(JSON.stringify({type: 'connect', op: 'init', userId: this.user.id}));
        } else {
          this.user = {};
          this.showError('用户未登录');
        }
      });
    },

    // 加载文件内容
    loadFile (id, filename) {
      if (this.doc && this.doc.id === id) return;                 // 去除无效操作
      if (this.doc && this.doc._events && this.doc._events.op) this.doc._events.op = null;                   // 清空监听事件
      this.doc = this.connection.get(this.project.projectId, id);
      this.doc.subscribe(this.init);    // 订阅
      this.doc.on('op', this.update);     // 文件被修改（他人或自己，都会更新
      this.currentFileName = filename;
    },

    // 编辑器辅助工具
    getPosition (row, column) {
      const lines = this.ace.getValue().split('\n');                    // 获取文档中所有行的内容
      let position = column;
      for (let i = 0; i < row; i++) position += lines[i].length + 1;
      return position;
    },
    getStringFromLines (lines) {
      let str = lines[0];
      for (let i = 1; i < lines.length; i++) {
        str += '\n' + lines[i];
      }
      return str;
    },
    lockEditor () {
      this.isEditorLoaded = false;
      setTimeout(() => {
        this.isEditorLoaded = true;
      }, 20);
    },
    getPoint (position) {
      const lines = this.ace.getValue().split('\n');
      const point = {row: 0, column: 0};
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (count + lines[i].length + 1 > position) {
          point.row = i;
          point.column = position - count;
          break;
        }
        count += lines[i].length + 1;     // 1是回车的占位符
      }
      return point;
    },

    // 编辑器操作
    add (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, string]);    // 在position的位置插入string字符串
    },
    remove (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, {d: string.length}]);    // 在position位置删除长度为string.length的字符串
    },

    // 文件内容加载完成后进行初始化
    init () {
      const nValue = this.doc.data;
      this.editorConfig.content = '';
      setTimeout(() => {
        this.editorConfig.content = nValue;
      }, 0);        // 防止两个文件初始内容一致导致无刷新
      this.socket.send(JSON.stringify({type: 'doc', op: 'switch', userId: this.user.id, docId: this.doc.id, userName: this.user.name}));
      this.lockEditor();
    },

    // 同步更新文件
    update (op, source) {
      console.log(op);
      if (!source && this.ace) {          // source === true代表此次操作是该客户端操作的，无需重复修改
        // 长度为1代表从0开始，长度不为1代表从其他位置开始
        // add: {0: 12, 1: 'adb'} 或者 {0: 'adb'}
        // remove: {0: 12, 1: {d: 2}} 或者 {0: {d:2}}
        // remove & add {0: 11, 1: 'new', 2: {d: 3}}
        if (op[op.length - 1].d) {      //  替换操作
          const type = typeof op[0];
          if (type === 'object') {                    // 从起始处进行删除操作
            const pStart = 0;
            const pEnd = op[0].d;
            const range = {
              start: this.getPoint(pStart),
              end: this.getPoint(pEnd)
            };
            this.editorLockTime++;
            this.ace.session.replace(range, '');      // 替换指定区域的内容
          } else if (type === 'string') {             // 从起始处进行批量替换操作
            const pStart = 0;
            const pEnd = op[1].d;
            const rangeDel = {
              start: this.getPoint(pStart),
              end: this.getPoint(pEnd)
            };
            const rangeAdd = {
              start: this.getPoint(pStart),
              end: this.getPoint(pStart)
            };
            this.editorLockTime += 2;
            this.ace.session.replace(rangeDel, '');         // 替换指定区域的内容
            this.ace.session.replace(rangeAdd, op[0]);      // 替换指定区域的内容
          } else if (type === 'number') {             // 从非起始处进行删除或替换操作
            const pStart = op[0];
            const pEnd = op[0] + op[op.length - 1].d;
            const range = {
              start: this.getPoint(pStart),
              end: this.getPoint(pEnd)
            };
            this.editorLockTime++;
            this.ace.session.replace(range, '');      // 替换指定区域的内容
            if (op.length === 3) {
              const rangeAdd = {
                start: this.getPoint(pStart),
                end: this.getPoint(pStart)
              };
              this.editorLockTime++;
              this.ace.session.replace(rangeAdd, op[1]);      // 替换指定区域的内容
            }
          }
        } else {
          // 新增操作
          const pStart = op.length === 1 ? 0 : op[0];
          const range = {
            start: this.getPoint(pStart),
            end: this.getPoint(pStart)
          };
          this.editorLockTime++;
          this.ace.session.replace(range, op[op.length - 1]);
        }
      }
    },
    addSelection (range) {
      console.log(range);
      this.ace.multiSelect.addRange(this.getRange(range));
    },
    getRange (range) {
      const r = this.ace.getSelectionRange();
      r.start.row = range.start.row;
      r.start.column = range.start.column;
      r.end.row = range.end.row;
      r.end.column = range.end.column;
      return r;
    },

    // 消息提示
    showError (title, msg) {
      this.$Notice.error({
        title: title,
        desc: msg
      });
    },
    showSuccess (title, msg) {
      this.$Notice.success({
        title: title,
        desc: msg
      });
    }
  }
};
</script>

<style>
.ace, .editor {
  width: 100%;
  height: 100%;
}
.ace {
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.left {
  width: 250px;
  height: 100%;
}
.right {
  flex: 1;
  height: 100%;
}
</style>
