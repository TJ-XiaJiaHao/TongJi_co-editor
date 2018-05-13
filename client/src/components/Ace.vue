<template>
  <div class="ace-container">
    <vSelector title="设定主题" :selections="themeSelections" @change="onThemeChange"></vSelector>
    <editor class="editor"
      :content="editorConfig.content"
      :lang="editorConfig.lang"
      :theme="editorConfig.theme"
      :sync="true"
      height="100%"
      width="100%"> </editor>
  </div>
</template>
<script>
import vSelector from '@/components/v-selector';
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
    editor
  },
  data () {
    return {
      ace: null,
      doc: null,
      isUpdating: false,
      themeSelections: ['monokai', 'test'],
      isEditorLoaded: false,
      editorConfig: {
        content: '',
        lang: 'javascript',
        theme: 'monokai'
      }
    };
  },

  mounted () {
    sharedb.types.register(otText.type);          // 注册text类型
    this.ace = this.$children[1].editor;          // 编辑器
    window.editor = this.ace;
    this.ace.session.on('change', (delta) => {    // 监听编辑器改动事件
      // 编辑器初始化
      if (!this.isEditorLoaded) {
        this.isEditorLoaded = true;
      } else if (delta.action === 'insert') {
        this.add(delta.start.row, delta.start.column, delta.lines);
      } else if (delta.action === 'remove') {
        this.remove(delta.start.row, delta.start.column, delta.lines);
      }
      console.log('change', delta);
    });
    const socket = new WebSocket('ws://localhost:3000/');
    const connection = new sharedb.Connection(socket);
    this.doc = connection.get('P_0001', 'P_0002');
    this.doc.subscribe(this.init);    // 订阅
    this.doc.on('op', this.update);     // 文件被修改（他人或自己，都会更新
  },

  methods: {
    onThemeChange (nVal) {
    },
    onChange (param) {
      console.log('onChange', arguments);
    },
    onCopy (param) {
      console.log('onCopy', arguments);
      const currentValue = this.$children[1].getValue();
      const editor = this.$children[1].editor;
      editor.setValue(currentValue + 'the ／new text here');
    },
    onPaste (param) {
      console.log('onPaste', arguments);
    },
    getPosition (row, column) {
      const lines = this.ace.getValue().split('\n');
      let position = column;
      for (let i = 0; i < row; i++) position += lines[i].length + 1;
      return position;
    },
    getStringFromLines (lines) {
      if(lines.length <= 0) return '';
      let str = lines[0];
      for (let i = 1; i < lines.length; i++) {
        str += '\n' + lines[i];
      }
      return str;
    },
    add (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, string]);
    },
    remove (row, column, lines) {
      const position = this.getPosition(row, column);
      const string = this.getStringFromLines(lines);
      this.doc.submitOp([position, {d: string.length}]);
    },
    init () {
      const nValue = this.doc.data;
      this.editorConfig.content = nValue;
    },
    getPoint (position) {
      const lines = this.ace.getValue().split('\n');
      let count = 0;
      const point = { row: 0, column: 0};
      for (let i = 0; i < lines.length; i++) {
        console.log(count, position);
        if (count + lines[i].length + 1 > position) {
          point.row = i;
          point.column = position - count;
          break;
        }
        count += lines[i].length + 1;     // 1是回车的占位符
      }
      console.log(position, point);
      return point;
    },
    update (op, source) {
      console.log(source, op);
      if (!source) {
        this.isEditorLoaded = false;
        // 长度为1代表从0开始，长度不为1代表从其他位置开始
        // add: {0: 12, 1: 'adb'} 或者 {0: 'adb'}
        // remove: {0: 12, 1: {d: 2}} 或者 {0: {d:2}}
        if (op[op.length - 1].d) {
          // 删除操作
          const pStart = op.length === 1 ? 0 : op[0];
          const pEnd = op.length === 1 ? op[0].d : op[0] + op[1].d;
          const range = {
            start: this.getPoint(pStart),
            end: this.getPoint(pEnd)
          };
          this.ace.session.replace(range, '');
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
</style>
