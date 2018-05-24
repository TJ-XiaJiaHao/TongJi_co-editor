<template>
  <div class="header">
    <div class="header-left">
      <img :src="projectIcon" class="icon-project"/>
      <select class="select" @change="changeProject" v-model="currentProjectId">
        <option v-for="selection in selections" :key="selection.projectName" :value="selection.projectId">{{selection.projectName}}</option>
      </select>
      <div class="op-container">
        <img :src="addIcon" class="op-icon" @click="createProject"/>
        <img :src="deleteIcon" class="op-icon" @click="deleteProject"/>
        <img :src="renameIcon" class="op-icon" @click="renameProject"/>
        <img :src="settingIcon" class="op-icon" @click="projectSetting = true" v-if="isRoot"/>
        <img :src="outIcon" class="op-icon" @click="removeUser(user.id)" v-else/>
      </div>
    </div>
    <div class="header-right">
      <div></div>
      <div class="login-form" v-if="!user.name">
        <label>用户名</label> <input v-model="username"/>
        <label>密码</label> <input v-model="password" type="password"/>
        <label class="login-btn" @click="login">登陆</label>
        <label class="login-btn" @click="register">注册</label>
      </div>
      <div class="userinfo" v-else>
        <label class="username" :class="{'notification': user.invitedProjects.length > 0}"  @click="showNotification = true">{{user.name.substr(0,1)}}</label>
        <img :src="logoutIcon" class="icon-logout" @click="logout"/>
      </div>
    </div>

    <Modal
      v-model="projectSetting"
      title="管理参与者">
      <div>
        <Input v-model="inviteUsername" placeholder="用户名" style="width: 300px" />
        <Button type="primary" @click="inviteUser">邀请</Button>
        <div v-for="user in project.opUsers" :key="user.id">
          <label>{{user.name}}</label>
          <Button type="error" @click="removeUser(user.id)">移除</Button>
        </div>
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

    <Modal
      width="200"
      :title="inputDialog.title"
      v-model="inputDialog.show"
      @on-ok="inputDialog.confirmHandle">
      <Input v-model="inputDialog.input"  style="width: 150px" />
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
import outIcon from './../assets/out.png';
import axios from 'axios';                                    // http协议库
export default {
  props: {
    user: {
      type: Object,
      default: null
    },
    host: {
      type: String,
      default: ''
    },
    project: {
      type: Object
    }
  },
  computed: {
    selections () {
      return this.user.selfProjects ? this.user.selfProjects.concat(this.user.joinProjects) : [];
    },
    isRoot () {
      return this.project.userId === this.user.id;
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
      outIcon,

      username: '',
      password: '',

      currentProjectId: '',
      projectSetting: false,
      showNotification: false,
      inviteUsername: '',

      inputDialog: {
        show: false,
        title: '',
        input: '',
        confirmHandle: '',
        cancelHandle: ''
      }
    };
  },
  methods: {
    // 登陆注册                   登出
    login () {
      if (this.username && this.password) {
        axios.post(`${this.host}/users/login`, {
          username: this.username,
          password: this.password
        }).then((res) => {
          const data = res.data;
          if (data.code === 0) this.$emit('updateUserInfo');
        });
      }
    },
    logout () {
      axios.post(`${this.host}/users/logout`).then((res) => {
        const data = res.data;
        if (data.code === 0) this.$emit('updateUserInfo');
      });
    },
    register () {
      if (this.username && this.password) {
        axios.post(`${this.host}/users/register`, {
          username: this.username,
          password: this.password
        }).then((res) => {
          const data = res.data;
          if (data.code === 0) this.$emit('updateUserInfo');
        });
      }
    },

    // 项目操作                   下载、上传
    createProject () {
      this.inputDialog.show = true;
      this.inputDialog.title = '请输入项目名';
      this.inputDialog.confirmHandle = () => {
        if (this.inputDialog.input !== '') {
          axios.post(`${this.host}/projects/create`, {
            projectName: this.inputDialog.input
          }).then((res) => {
            const data = res.data;
            console.log(data);
            if (data.code === 0) this.$emit('updateUserInfo');
          });
        }
      };
    },
    changeProject () {
      this.$emit('changeProject', this.currentProjectId);
    },
    renameProject () {
      this.inputDialog.show = true;
      this.inputDialog.title = '请输入项目名';
      this.inputDialog.confirmHandle = () => {
        if (this.inputDialog.input !== '') {
          axios.post(`${this.host}/projects/rename`, {
            projectId: this.currentProjectId,
            projectName: this.inputDialog.input
          }).then((res) => { });
        }
      };
    },
    deleteProject () {
      axios.post(`${this.host}/projects/delete`, {
        projectId: this.currentProjectId
      }).then((res) => { });
    },
    removeUser (userId) {
      axios.post(`${this.host}/projects/removeUser`, {
        projectId: this.currentProjectId,
        userId: userId
      }).then((res) => { });
    },

    // 发送邀请和接受邀请
    inviteUser () {
      if (this.inviteUsername && this.inviteUsername !== '') {
        axios.post(`${this.host}/projects/inviteUser`, {
          projectId: this.currentProjectId,
          username: this.inviteUsername
        }).then((res) => {
          const data = res.data;
          if (data.code === 0) console.log(data);
        });
      }
    },
    acceptInvite (projectId) {
      axios.post(`${this.host}/users/acceptInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) this.$emit('updateUserInfo');
      });
    },
    rejectInvite (projectId) {
      axios.post(`${this.host}/users/rejectInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) this.$emit('updateUserInfo');
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
