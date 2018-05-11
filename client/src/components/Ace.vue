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

export default {
  components: {
    vSelector,
    editor
  },
  data () {
    return {
      ace: null,
      doc: null,
      themeSelections: ['monokai', 'test'],
      editorConfig: {
        content: 'function(){ console.log("test") }',
        lang: 'javascript',
        theme: 'monokai'
      }
    };
  },

  mounted () {
    this.ace = this.$children[1].editor;
    this.ace.session.on('change', (delta) => {
      const nValue = this.ace.getValue();
      this.doc.submitOp([{p: ['document', 'value'], od: '', oi: nValue}]);
    });
    const socket = new WebSocket('ws://localhost:3000/');
    const connection = new sharedb.Connection(socket);
    this.doc = connection.get('P_0001', 'P_0001');
    this.doc.subscribe(this.update);    // 订阅
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
    update () {
      this.editorConfig.content = this.doc.data.document.value;
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
