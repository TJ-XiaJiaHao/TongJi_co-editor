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
        <img :src="downloadIcon" class="op-icon" @click="downloadProject"/>
        <img :src="settingIcon" class="op-icon" @click="projectSetting = true" v-if="isRoot"/>
        <img :src="outIcon" class="op-icon" @click="removeUser(user.id)" v-else/>
      </div>
    </div>
    <div class="header-right">
      <div class="file-name"> {{title}} </div>
      <div>
        <span v-for="(user, index) in coUsers" :key = "user.userId" class="co-users">
          <span :style="{background: colors[index % colors.length]}" class="co-user-color"></span>
          <span>{{user.userName}}</span>
        </span>
      </div>
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
      width="350"
      v-model="projectSetting"
      title="管理参与者">
      <div>
        <Input v-model="inviteUsername" placeholder="用户名" style="width: 250px; margin-right: 5px;" />
        <Button type="primary" @click="inviteUser">邀请</Button>
        <div v-for="user in project.opUsers" :key="user.id">
          <label style="width: 250px;display: inline-block;margin: 15px 5px 0 0">{{user.name}}</label>
          <Button type="error" @click="removeUser(user.id)">移除</Button>
        </div>
      </div>
    </Modal>

    <Modal
      v-model="showNotification"
      width="350"
      :title="`${user.name}的通知`">
      <div v-for="item in user.invitedProjects" :key="item.projectId">
        <label style="width: 90px;display: inline-block;margin: 15px 5px 0 0">{{item.projectName}}</label>
        <label style="width: 90px;display: inline-block;margin: 15px 5px 0 0">{{item.username}}</label>
        <Button type="success" @click="acceptInvite(item.projectId)">接受</Button>
        <Button type="error" @click="rejectInvite(item.projectId)">拒绝</Button>
      </div>
    </Modal>

    <Modal
      width="200"
      :title="inputDialog.title"
      v-model="inputDialog.show"
      @on-ok="inputDialog.confirmHandle">
      <Input v-if="inputDialog.input !== null" v-model="inputDialog.input"  style="width: 150px" />
      <p v-if="inputDialog.msg !== null">{{inputDialog.msg}}</p>
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
import downloadIcon from './../assets/download.png';
import axios from 'axios';                                    // http协议库
export default {
  props: {
    user: {
      type: Object,
      default: null
    },
    coUsers: {
      type: Array
    },
    host: {
      type: String,
      default: ''
    },
    project: {
      type: Object
    },
    title: {
      type: String,
      default: ''
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
      downloadIcon,

      colors: ['red', 'blue', 'orange'],

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
        msg: null,
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
          console.log(data);
          if (data.code === 0) this.$emit('updateUserInfo');
          else this.showError('登陆失败', '用户名或密码错误');
        });
      }
    },
    logout () {
      axios.post(`${this.host}/users/logout`).then((res) => {
        const data = res.data;
        if (data.code === 0) this.$emit('updateUserInfo');
        else this.showError('登出失败', '');
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
          else this.showError('注册失败', data.msg);
        });
      }
    },

    // 项目操作                   下载、上传
    createProject () {
      this.showDialog('', null, '请输入项目名', () => {
        if (this.inputDialog.input !== '') {
          axios.post(`${this.host}/projects/create`, {
            projectName: this.inputDialog.input
          }).then((res) => {
            const data = res.data;
            if (data.code === 0) {
              this.showSuccess('项目创建成功', '');
              this.$emit('updateUserInfo');
            } else this.showError('项目创建失败', data.msg);
          });
        }
      });
    },
    changeProject () {
      this.$emit('changeProject', this.currentProjectId);
    },
    renameProject () {
      this.showDialog('', null, '请输入项目名', () => {
        if (this.inputDialog.input !== '') {
          axios.post(`${this.host}/projects/rename`, {
            projectId: this.currentProjectId,
            projectName: this.inputDialog.input
          }).then((res) => {
            if (res.data.code !== 0) this.showError('项目重命名失败');
          });
        }
      });
    },
    deleteProject () {
      this.showDialog(null, '项目删除后将无法找回，是否确认删除？', '确认框', () => {
        axios.post(`${this.host}/projects/delete`, {
          projectId: this.currentProjectId
        }).then((res) => {
          if (res.data.code === 0) this.showSuccess('项目删除成功');
          else this.showError('项目删除失败');
        });
      });
    },
    removeUser (userId) {
      this.showDialog(null, '是否确认退出？退出后只有管理员有权限邀请！', '确认框', () => {
        axios.post(`${this.host}/projects/removeUser`, {
          projectId: this.currentProjectId,
          userId: userId
        }).then((res) => {
          if (res.data.code === 0) {
            this.$emit('updateProject');
            this.showSuccess('成员移除成功');
          } else this.showError('成员移除失败');
        });
      });
    },
    downloadProject () {
      window.open(`${this.host}/download?projectId=${this.project.projectId}`);
    },

    // 发送邀请和接受邀请
    inviteUser () {
      if (this.inviteUsername && this.inviteUsername !== '') {
        axios.post(`${this.host}/projects/inviteUser`, {
          projectId: this.currentProjectId,
          username: this.inviteUsername
        }).then((res) => {
          const data = res.data;
          if (data.code === 0) this.showSuccess('邀请成员成功，正在等待对方处理');
          else this.showError('邀请成员失败', data.msg);
        });
      }
    },
    acceptInvite (projectId) {
      axios.post(`${this.host}/users/acceptInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) {
          this.showSuccess('成功加入项目');
          this.$emit('updateUserInfo');
        } else this.showError('加入项目失败');
      });
    },
    rejectInvite (projectId) {
      axios.post(`${this.host}/users/rejectInvite`, {
        projectId: projectId
      }).then((res) => {
        const data = res.data;
        if (data.code === 0) {
          this.$emit('updateUserInfo');
        } else this.showError('拒绝失败');
      });
    },

    // 消息提示
    showDialog (input, msg, title, confirmHandle) {
      this.inputDialog.show = true;
      this.inputDialog.input = input;
      this.inputDialog.msg = msg;
      this.inputDialog.title = title;
      this.inputDialog.confirmHandle = confirmHandle;
    },
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
.co-users {
  margin-left: 5px;
}
.co-user-color {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  display: inline-block;
}
.file-name {
  width: 100px;
  padding-left: 5px;
  text-align: left;
}
.notification {
  border: 1px solid red;
}
</style>
