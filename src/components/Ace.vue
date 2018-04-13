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
import vSelector from '@/components/v-selector'
import editor from 'ace-vue2'
import 'brace/mode/javascript'
import 'brace/mode/css'
import 'brace/theme/chrome'
import 'brace/theme/monokai'

export default {
  components: {
    vSelector,
    editor
  },
  data () {
    return {
      ace: null,
      themeSelections: ['monokai', 'test'],
      editorConfig: {
        content: 'function(){ console.log("test") }',
        lang: 'javascript',
        theme: 'monokai'
      }
    }
  },

  mounted () {
    this.$children[1].editor.session.on('change', function (delta) {
      console.log(delta)
    })
  },

  methods: {
    onThemeChange (nVal) {
    },
    onChange (param) {
      console.log('onChange', arguments)
    },
    onCopy (param) {
      console.log('onCopy', arguments)
      const currentValue = this.$children[1].getValue()
      const editor = this.$children[1].editor
      editor.setValue(currentValue + 'the ／new text here')
    },
    onPaste (param) {
      console.log('onPaste', arguments)
    }
  }
}
</script>

<style>
.ace-container, .editor {
  width: 100%;
  height: 100%;
}
</style>
