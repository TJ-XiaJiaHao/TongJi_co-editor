<template>
  <div class="ace">
    <vHeader :selections="user.projects" :user="user"
             @login="login"
             @register="register"></vHeader>
    <div class="content">
      <div class="left">
        <vFileSystem :files = "project.files" @loadFile="loadFile"
                     @createFolder="createFolder"
                     @createFile="createFile"
                     @deleteFolder="deleteFolder"
                     @deleteFile="deleteFile"
                     @renameFolder="renameFolder"
                     @renameFile="renameFile"></vFileSystem>
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
      connection: null,                                 // sharedb连接\
      isEditorLoaded: false,                            // 编辑器是否加载完成
      editorConfig: {                                   // 编辑器配置
        content: '',
        lang: 'javascript',
        theme: 'monokai'
      },
      user: {},                                          // 用户信息
      host: 'http://localhost:3000',                     // 后端主机
      fsSocket: null                                     // 文件系统socket
    };
  },

  mounted () {
    // 编辑器初始化
    this.ace = this.$children[this.$children.length - 1].editor;          // 编辑器
    this.ace.session.on('change', (delta) => {    // 监听编辑器改动事件
      if (!this.isEditorLoaded) {
        // this.isEditorLoaded = true;
      } else if (delta.action === 'insert') {
        this.add(delta.start.row, delta.start.column, delta.lines);
      } else if (delta.action === 'remove') {
        this.remove(delta.start.row, delta.start.column, delta.lines);
      }
    });

    // sharedb初始化
    sharedb.types.register(otText.type);          // 注册text类型
    const socket = new WebSocket('ws://localhost:3000/');
    this.connection = new sharedb.Connection(socket);

    // 文件系统socket初始化
    this.fsSocket = new WebSocket('ws://localhost:3000/');
    this.fsSocket.onmessage = (res) => {
      const data = JSON.parse(res.data);
      if (data.files) this.project.files = data.files;
    };

    axios.defaults.withCredentials = true;            // 配置axios自动设置cookie
    this.loadUserInfo();
  },

  methods: {

    login (username, password) {
      axios.post(`${this.host}/users/login`, {
        username,
        password
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) {
          this.user = data.user;
        }
      });
    },

    register (username, password) {
      axios.post(`${this.host}/users/register`, {
        username,
        password
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) {
          this.user = data.user;
        }
      });
    },

    /*
     *  加载用户信息
     */
    loadUserInfo () {
      axios.get(`${this.host}/users/getUserInfo`).then((res) => {
        if (res.data.code === 0) {
          this.user = res.data.user;
        }
      });
      // const projectId = '4f5d9bd0-58e5-11e8-8854-2511af6a5590';
      // loadProject(projectId);
    },

    /*
     *  删除文件夹
     */
    deleteFolder (id) {
      axios.post(`${this.host}/projects/deleteFolder`, {
        projectId: this.project.projectId,
        folderId: id
      }).then((data) => {
        this.project.files = data.data.files;
        this.syncFS();
      });
    },

    /*
     *  删除文件
     */
    deleteFile (id) {
      axios.post(`${this.host}/projects/deleteFile`, {
        projectId: this.project.projectId,
        fileId: id
      }).then((data) => {
        this.project.files = data.data.files;
        this.syncFS();
      });
    },

    /*
     *  新建文件夹
     */
    createFolder (father) {
      const name = prompt('请输入文件名');
      if (name) {
        axios.post(`${this.host}/projects/createFolder`, {
          projectId: this.project.projectId,
          folderName: name,
          fatherId: father
        }).then((data) => {
          this.project.files = data.data.files;
          this.syncFS();
        });
      }
    },

    /*
     *  新建文件
     */
    createFile (father) {
      const name = prompt('请输入文件名');
      if (name) {
        axios.post(`${this.host}/projects/createFile`, {
          projectId: this.project.projectId,
          fileName: name,
          fatherId: father
        }).then((data) => {
          this.project.files = data.data.files;
          this.syncFS();
        });
      }
    },
    renameFolder (id) {
      const name = prompt('请输入文件名');
      if (name) {
        axios.post(`${this.host}/projects/renameFolder`, {
          projectId: this.project.projectId,
          folderId: id,
          folderName: name
        }).then((data) => {
          this.project.files = data.data.files;
          this.syncFS();
        });
      }
    },
    renameFile (id) {
      const name = prompt('请输入文件名');
      if (name) {
        axios.post(`${this.host}/projects/renameFile`, {
          projectId: this.project.projectId,
          fileId: id,
          fileName: name
        }).then((data) => {
          this.project.files = data.data.files;
          this.syncFS();
        });
      }
    },

    syncFS () {
      this.fsSocket.send(JSON.stringify({type: 'fs', id: this.project.projectId, op: 'update', files: this.project.files}));
    },

    /*
     *  加载文档内容
     */
    loadFile (id) {
      if (this.doc && this.doc.id === id) return;                 // 去除无效操作
      if (this.doc) this.doc._events.op = null;                   // 清空监听事件
      this.doc = this.connection.get(this.project.projectId, id);
      this.doc.subscribe(this.init);    // 订阅
      this.doc.on('op', this.update);     // 文件被修改（他人或自己，都会更新
    },

    /*
     *  加载项目内容
     */
    loadProject (projectId) {
      axios.get(`${this.host}/projects/details?projectId=${projectId}`).then((data) => {
        this.project = data.data.project;
        this.fsSocket.send(JSON.stringify({type: 'fs', id: this.project.projectId, op: 'init'}));
      });
    },

    /*
     *  根据行和列获取字符串所在位置
     */
    getPosition (row, column) {
      const lines = this.ace.getValue().split('\n');                    // 获取文档中所有行的内容
      let position = column;
      for (let i = 0; i < row; i++) position += lines[i].length + 1;
      return position;
    },

    /*
     *  把行数组转换成一个字符串
     */
    getStringFromLines (lines) {
      let str = lines[0];
      for (let i = 1; i < lines.length; i++) {
        str += '\n' + lines[i];
      }
      return str;
    },

    /*
     *  新增操作
     */
    add (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, string]);    // 在position的位置插入string字符串
    },

    /*
     *  删除操作
     */
    remove (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, {d: string.length}]);    // 在position位置删除长度为string.length的字符串
    },

    /*
     *  第一次获取文档内容后初始化
     */
    init () {
      const nValue = this.doc.data;
      this.editorConfig.content = '';
      setTimeout(() => {
        this.editorConfig.content = nValue;
      }, 0);        // 防止两个文件初始内容一致导致无刷新
      this.lockEditor();
    },

    /*
     *  锁定编辑器，让这之内的编辑操作不进行同步
     */
    lockEditor () {
      this.isEditorLoaded = false;
      setTimeout(() => {
        this.isEditorLoaded = true;
      }, 20);
    },
    /*
     *  把位置转化成行和列的对象
     */
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

    /*
     *  他人或自己对文档进行修改后进行更新
     */
    update (op, source) {
      if (!source && this.ace) {          // source === true代表此次操作是该客户端操作的，无需重复修改
        this.lockEditor();
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
            this.ace.session.replace(rangeDel, '');         // 替换指定区域的内容
            this.ace.session.replace(rangeAdd, op[0]);      // 替换指定区域的内容
          } else if (type === 'number') {             // 从非起始处进行删除或替换操作
            const pStart = op[0];
            const pEnd = op[0] + op[op.length - 1].d;
            const range = {
              start: this.getPoint(pStart),
              end: this.getPoint(pEnd)
            };
            this.ace.session.replace(range, '');      // 替换指定区域的内容
            if (op.length === 3) {
              const rangeAdd = {
                start: this.getPoint(pStart),
                end: this.getPoint(pStart)
              };
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
          this.ace.session.replace(range, op[op.length - 1]);
        }
      }
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
