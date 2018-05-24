<template>
  <div @click="leftClick" @contextmenu.prevent="rightClick" class="file-system" @scroll="scroll">
    <vFileTree :files="project.files" @loadFile="loadFile"></vFileTree>

    <div class="menu" v-if="menu.show" :style="{left: menu.left + 'px', top: menu.top + 'px', width: menu.width + 'px'}">
      <div class="menu-item" v-for="item in menu.items" :key="item.name" :style="{height: menu.itemHeight + 'px', lineHeight: menu.itemHeight + 'px'}" @click="handleFn(item.handle)">{{item.name}}</div>
    </div>

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
import vFileTree from '@/components/v-filetree';
import axios from 'axios';                                    // http协议库
export default {
  components: {
    vFileTree
  },
  props: {
    project: {
      type: Object,
      default: () => []
    },
    host: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      menu: {
        show: false,
        top: 0,
        left: 0,
        width: 100,
        itemHeight: 25,
        items: [{
          name: '新建文件夹',
          handle: 'createFolder'
        }, {
          name: '新建文件',
          handle: 'createFile'
        }, {
          name: '删除',
          handle: 'delete'
        }, {
          name: '重命名',
          handle: 'rename'
        }]
      },
      rightClickFile: null,
      scrollTop: 0,
      scrollLeft: 0,

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
    handleFn (fn) {
      this.menu.show = false;
      this[fn]();
    },

    // 文件系统基本操作
    createFolder () {
      this.inputDialog.show = true;
      this.inputDialog.title = '请输入文件夹名';
      this.inputDialog.confirmHandle = () => {
        axios.post(`${this.host}/projects/createFolder`, {
          projectId: this.project.projectId,
          folderName: this.inputDialog.input,
          fatherId: this.rightClickFile.id
        }).then((data) => {
          this.$emit('syncFS', data.data.files);
        });
      };
    },
    createFile () {
      this.inputDialog.show = true;
      this.inputDialog.title = '请输入文件夹名';
      this.inputDialog.confirmHandle = () => {
        axios.post(`${this.host}/projects/createFile`, {
          projectId: this.project.projectId,
          fileName: this.inputDialog.input,
          fatherId: this.rightClickFile.id
        }).then((data) => {
          this.$emit('syncFS', data.data.files);
        });
      };
    },
    delete () {
      if (this.rightClickFile.type === 0) {
        axios.post(`${this.host}/projects/deleteFolder`, {
          projectId: this.project.projectId,
          folderId: this.rightClickFile.id
        }).then((data) => {
          this.$emit('syncFS', data.data.files);
        });
      } else if (this.rightClickFile.type === 1) {
        axios.post(`${this.host}/projects/deleteFile`, {
          projectId: this.project.projectId,
          fileId: this.rightClickFile.id
        }).then((data) => {
          this.$emit('syncFS', data.data.files);
        });
      }
    },
    rename () {
      if (this.rightClickFile.type === 0) {
        this.inputDialog.show = true;
        this.inputDialog.title = '请输入文件夹名';
        this.inputDialog.confirmHandle = () => {
          axios.post(`${this.host}/projects/renameFolder`, {
            projectId: this.project.projectId,
            folderId: this.rightClickFile.id,
            folderName: this.inputDialog.input
          }).then((data) => {
            this.$emit('syncFS', data.data.files);
          });
        };
      } else if (this.rightClickFile.type === 1) {
        this.inputDialog.show = true;
        this.inputDialog.title = '请输入文件名';
        this.inputDialog.confirmHandle = () => {
          axios.post(`${this.host}/projects/renameFile`, {
            projectId: this.project.projectId,
            fileId: this.rightClickFile.id,
            fileName: this.inputDialog.input
          }).then((data) => {
            this.$emit('syncFS', data.data.files);
          });
        };
      }
    },

    // 加载指定文件
    loadFile (id) {
      this.$emit('loadFile', id);
    },

    // 鼠标操作
    scroll (e) {
      this.scrollTop = e.target.scrollTop;
      this.scrollLeft = e.target.scrollLeft;
    },
    leftClick (e) {
      this.menu.show = false;
    },
    rightClick (e) {
      // 记录右击选中的文件或文件夹
      const folder = e.path.filter((item) => { return item.className && item.className.indexOf('type-folder') >= 0; })[0];
      const file = e.path.filter((item) => { return item.className && item.className.indexOf('type-file') >= 0; })[0];
      if (folder) this.rightClickFile = { type: 0, id: folder.id };
      else if (file) this.rightClickFile = { type: 1, id: file.id };
      else this.rightClickFile = {type: -1, id: '-1'};

      // 显示菜单栏
      const container = e.path.filter((item) => { return item.className === 'file-system'; })[0];
      const containerHeight = container.offsetHeight;
      const containerWidth = container.offsetWidth;
      this.menu.show = true;
      this.menu.top = e.clientY + this.scrollTop + 5 - 20;
      this.menu.left = e.clientX + this.scrollLeft + 5;
      if (e.clientX + this.menu.width > containerWidth) this.menu.left -= this.menu.width + 10;
      if (e.clientY + this.menu.items.length * this.menu.itemHeight > containerHeight) this.menu.top -= this.menu.items.length * this.menu.itemHeight + 10;
    }
  }
};
</script>
<style>
.file-system {
  width: 100%;
  height: 100%;
  background: rgb(60, 63, 65);
  overflow-x: hidden;
  overflow-y: scroll;
  position: relative;
  color: rgb(187, 187, 187);
}
.menu {
  position: absolute;
  border: 1px solid rgb(81, 81, 81);
  background: rgb(60, 63, 65);
  border-radius: 2px;
  z-index: 1000;
}

.menu-item {
  border: 1px solid rgb(81, 81, 81);
  font-size: 14px;
  cursor: default;
}
.menu-item:hover {
  background: rgb(75, 110, 175);
}
::-webkit-scrollbar {/*隐藏滚轮*/
  display: none;
}
</style>
