<template>
  <div class="home">
    <h1>Realtime Collaboration Quickstart</h1>
    <p>Now that your application is running, simply type in either text box and see your changes instantly appear in the other one. Open
    this same document in a <a onclick="window.open(window.location.href);return false;" target="_blank">new tab</a> to see it work across tabs.</p>
    <textarea id="text_area_1"></textarea>
    <textarea id="text_area_2"></textarea>
    <button id="auth_button" v-if="showAuthBtn" @click="authorize(true)">Authorize</button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      realtimeUtils: null,
      clientId: '141438374469-nhu6cgcd0tk3pi2hofdor7kc5an0sjp6.apps.googleusercontent.com',
      showAuthBtn: false
    }
  },
  mounted () {
    // 检查clientID格式
    if (!/^([0-9])$/.test(this.clientId[0])) alert('Invalid Client ID - did you forget to insert your application Client ID?')
    this.realtimeUtils = new window.utils.RealtimeUtils({clientId: this.clientId})
    this.authorize(false)
  },
  methods: {
    authorize (isGoToLogin) {
      this.realtimeUtils.authorize((response) => {
        // 如果用户时第一次请求，一定会失败，所以，需要用户点击验证按钮
        console.log('authorize res: ', response)
        if (response.error) {
          this.showAuthBtn = true
        } else {
          this.start()
        }
      }, isGoToLogin)
    },
    start () {
      const id = this.realtimeUtils.getParam('id')
      console.log('load file ID: ', id)
      if (id) {
        this.realtimeUtils.load(id.replace('/', ''), this.onFileLoaded, this.onFileInitialize)
      } else {
        this.realtimeUtils.createRealtimeFile('New Quickstart File', (createResponse) => {
          console.log('create file ID: ', createResponse.id)
          // window.history.pushState(null, null, '?id=' + createResponse.id)
          this.realtimeUtils.load(createResponse.id, this.onFileLoaded, this.onFileInitialize)
        })
      }
    },
    onFileInitialize (model) {
      console.log(model)
      const string = model.createString()
      string.setText('Welcome to the Quickstart App!')
      model.getRoot().set('demo_string', string)
    },
    onFileLoaded (doc) {
      console.log(doc)
      const collaborativeString = doc.getModel().getRoot().get('demo_string')
      console.log('onFileLoaded', collaborativeString)
    }
  }
}
</script>

<style>
.home {
  width: 100%;
  height: 100%;
}
</style>
