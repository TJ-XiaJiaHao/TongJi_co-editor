<template>
  <div class="header">
    <div class="header-left">
      <img :src="projectIcon" class="icon-project"/>
      <select class="select">
        <option v-for="selection in selections" :key="selection.name">{{selection.name}}</option>
      </select>
      <div class="op-container">
        <img :src="addIcon" class="op-icon"/>
        <img :src="deleteIcon" class="op-icon"/>
        <img :src="renameIcon" class="op-icon"/>
        <img :src="settingIcon" class="op-icon"/>
      </div>
    </div>
    <div class="header-right">
      <div></div>
      <div class="login-form" v-if="!user.name">
        <label>用户名</label>
        <input v-model="username"/>
        <label>密码</label>
        <input v-model="password" type="password"/>
        <label class="login-btn" @click="login">登陆</label>
        <label class="login-btn" @click="register">注册</label>
      </div>
      <div class="userinfo" v-else>
        <label class="username">{{user.name.substr(0,1)}}</label>
        <img :src="logoutIcon" class="icon-logout" />
      </div>
    </div>
  </div>
</template>
<script>
import addIcon from './../assets/add.png';
import deleteIcon from './../assets/delete.png';
import projectIcon from './../assets/project.png';
import renameIcon from './../assets/rename.png';
import settingIcon from './../assets/setting.png';
import logoutIcon from './../assets/logout.png';
export default {
  props: {
    selections: {
      type: Array
    },
    user: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      addIcon,
      deleteIcon,
      projectIcon,
      renameIcon,
      settingIcon,
      logoutIcon,
      username: '',
      password: ''
    };
  },
  methods: {
    login () {
      if (this.username && this.password) {
        this.$emit('login', this.username, this.password);
      }
    },
    register () {
      if (this.username && this.password) {
        this.$emit('register', this.username, this.password);
      }
    }
  }
};
</script>
<style>
.header {
  display: flex;
  flex-direction: row;
  background: rgb(60, 63, 65);
  color: rgb(187, 187, 187);
  border-bottom: 1px solid rgb(40, 40, 40);
  font-size: 14px;
  height: 20px;
}
.header-left {
  padding: 0 2px;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  width: 250px;
  display: flex;
  flex-direction: row;
  border-right: 1px solid rgb(187, 187, 187);
}
.select {
  background: rgb(60, 63, 65);
  color: rgb(187, 187, 187);
  border: none;
  outline: none;
  width: 130px;
}
.icon-project {
  width: 20px;
  height: 20px;
}
.icon-logout {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.op-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}
.op-icon {
  width: 15px;
  height: 15px;
  margin-right: 5px;
}

.header-right {
  display: flex;
  flex-direction: row;
  flex: 1;
}
.login-form, .userinfo {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}
.login-form input {
  background: rgb(60, 63, 65);
  border: none;
  border-bottom: 1px solid rgb(187, 187, 187);
  outline: none;
  color: rgb(187, 187, 187);
  width: 100px;
  margin: 0 5px;
}
.login-form .login-btn {
  margin: 0 10px;
  cursor: pointer;
}
.userinfo .username {
  margin-right: 5px;
  width: 15px;
  height: 15px;
  line-height: 15px;
  background: rgb(187, 187, 187);
  color: rgb(60, 63, 65);
  -webkit-border-radius: 50%;
  -moz-border-radius: 50%;
  border-radius: 50%;
  cursor: pointer;
}
</style>
