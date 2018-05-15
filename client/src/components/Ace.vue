<template>
  <div class="ace-container">
    <div class="left-content">
      <vFileSystem :files = "files" @loadFile="loadFile" @createFolder="createFolder" @createFile="createFile"></vFileSystem>
      <vSelector title="设定主题" :selections="themeSelections" @change="onThemeChange"></vSelector>
    </div>
    <div class="right-content">
      <editor class="editor"
              :content="editorConfig.content"
              :lang="editorConfig.lang"
              :theme="editorConfig.theme"
              :sync="true"
              height="100%"
              width="100%"> </editor>
    </div>
  </div>
</template>
<script>
import vSelector from '@/components/v-selector';
import vFileSystem from '@/components/v-filesystem.vue';
import editor from 'ace-vue2';
import 'brace/mode/javascript';
import 'brace/mode/css';
import 'brace/theme/chrome';
import 'brace/theme/monokai';
import sharedb from 'sharedb/lib/client';
import Websocket from 'ws';
import otText from 'ot-text';

export default {
  components: {
    vSelector,
    vFileSystem,
    editor
  },
  data () {
    return {
      ace: null,
      doc: null,
      docs: [],
      projectId: 'P_0001',
      connection: null,
      isUpdating: false,
      themeSelections: ['monokai', 'test'],
      isEditorLoaded: false,
      editorConfig: {
        content: '',
        lang: 'javascript',
        theme: 'monokai'
      },
      files: []
    };
  },

  mounted () {
    this.loadFiles();
    sharedb.types.register(otText.type);          // 注册text类型
    this.ace = this.$children[this.$children.length - 1].editor;          // 编辑器
    this.ace.session.on('change', (delta) => {    // 监听编辑器改动事件
      // 编辑器初始化
      if (!this.isEditorLoaded) {
        // this.isEditorLoaded = true;
      } else if (delta.action === 'insert') {
        this.add(delta.start.row, delta.start.column, delta.lines);
      } else if (delta.action === 'remove') {
        this.remove(delta.start.row, delta.start.column, delta.lines);
      }
    });
    const socket = new WebSocket('ws://localhost:3000/');
    this.connection = new sharedb.Connection(socket);
  },

  methods: {
    onThemeChange (nVal) {
    },
    createFolder (father) {
      const name = prompt('请输入文件名');
      this.addToFiles({
        name: name,
        showChildren: true,
        children: []
      }, this.files, father);
    },
    createFile (father) {
      const name = prompt('请输入文件名');
      this.addToFiles({
        name: name,
        id: name
      }, this.files, father);
    },
    addToFiles (obj, files, folderName) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].name === folderName) {
          files[i].children.push(obj);
          files[i].children.sort((item) => !item.children);
        } else if (files[i].children) this.addToFiles(obj, files[i].children, folderName);
      }
    },
    loadFile (id) {
      if (this.doc && this.doc.id === id) return;                 // 去除无效操作
      if (this.doc) this.doc._events.op = null;                   // 清空监听事件
      this.doc = this.connection.get(this.projectId, id);
      this.doc.subscribe(this.init);    // 订阅
      this.doc.on('op', this.update);     // 文件被修改（他人或自己，都会更新
    },
    loadFiles () {
      this.files = [{
        name: 'folder1',
        showChildren: true,
        children: [{
          name: 'folder2',
          showChildren: false,
          children: [
            { name: 'file1' },
            { name: 'file2' }
          ]
        }, {
          name: 'folder3',
          showChildren: true,
          children: [{ name: 'file3' }]
        }]
      }, { name: 'P_0001', id: 'P_0001' },
      { name: 'P_0002', id: 'P_0002' },
      { name: 'P_0004', id: 'P_0004' }
      ];
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
      this.editorConfig.content = nValue;
      this.lockEditor();
    },

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
      const point = { row: 0, column: 0};
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
        if (op[op.length - 1].d) {      //  删除操作
          const pStart = op.length === 1 ? 0 : op[0];
          const pEnd = op.length === 1 ? op[0].d : op[0] + op[1].d;
          const range = {
            start: this.getPoint(pStart),
            end: this.getPoint(pEnd)
          };
          this.ace.session.replace(range, '');      // 替换指定区域的内容
        } else {
          // 新增操作
          const pStart = op.length === 1 ? 0 : op[0];
          const range = {
            start: this.getPoint(pStart),
            end: this.getPoint(pStart)
          };
          this.ace.session.replace(range, op[1]);
        }
      }
    }
  }
};
</script>

<style>
.ace-container, .editor {
  width: 100%;
  height: 100%;
}
.ace-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.left-content {
  width: 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.right-content {
  flex: 1;
  height: 100%;
}
</style>
