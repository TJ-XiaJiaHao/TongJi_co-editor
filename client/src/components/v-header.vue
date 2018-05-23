<template>
  <div class="header">
    <div class="header-left">
      <img :src="projectIcon" class="icon-project"/>
      <select class="select" @change="changeProject" v-model="currentProjectId">
        <option v-for="selection in selections" :key="selection.projectName" :value="selection.projectId">{{selection.projectName}}</option>
      </select>
      <div class="op-container">
        <img :src="addIcon" class="op-icon" @click="createProject"/>
        <img :src="deleteIcon" class="op-icon"/>
        <img :src="renameIcon" class="op-icon"/>
        <img :src="settingIcon" class="op-icon" @click="projectSetting = true"/>
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
        <label class="username" :class="{'notification': user.invitedProjects}"  @click="showNotification = true">{{user.name.substr(0,1)}}</label>
        <img :src="logoutIcon" class="icon-logout" />
      </div>
    </div>

    <Modal
      v-model="projectSetting"
      title="Common Modal dialog box title">
      <div>
        <Input v-model="inviteUsername" placeholder="用户名" style="width: 300px" />
        <Button type="primary" @click="inviteUser">邀请</Button>
      </div>
    </Modal>

    <Modal
      v-model="showNotification"
      title="通知">
      <div v-for="item in user.invitedProjects" :key="item.projectId">
        <label>{{item.projectName}}</label>
        <label>{{item.username}}</label>
        <Button type="success" @click="acceptInvite(item.projectId)">接受</Button>
        <Button type="error" @click="rejectInvite(item.projectId)">拒绝</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import addIcon from './../assets/add.png';
import deleteIcon from './../assets/delete.png';
import projectIcon from './../assets/project.png';
import renameIcon from './../assets/rename.png';
import settingIcon from './../assets/setting.png';
import logoutIcon from './../assets/logout.png';
import axios from 'axios';                                    // http协议库
export default {
  props: {
    selections: {
      type: Array
    },
    user: {
      type: Object,
      default: null
    },
    project: {
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
      password: '',
      currentProjectId: '',
      projectSetting: false,
      showNotification: false,
      inviteUsername: '',
      host: 'http://localhost:3000'                     // 后端主机
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
    },
    createProject () {
      this.$emit('createProject');
    },
    changeProject () {
      this.$emit('changeProject', this.currentProjectId);
    },
    inviteUser () {
      if (this.inviteUsername && this.inviteUsername !== '') {
        this.$emit('inviteUser', this.inviteUsername);
      }
    },
    acceptInvite (projectId) {
      axios.post(`${this.host}/users/acceptInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        console.log(data);
      });
    },
    rejectInvite (projectId) {
      axios.post(`${this.host}/users/rejectInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        console.log(data);
      });
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
.notification {
  border: 1px solid red;
}
</style>
