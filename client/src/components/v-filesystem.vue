<template>
  <div @click="leftClick" @contextmenu.prevent="rightClick" class="file-system" @scroll="scroll">
    <fileTree :files="files" @loadFile="loadFile"></fileTree>

    <div class="menu" v-if="menu.show" :style="{left: menu.left + 'px', top: menu.top + 'px', width: menu.width + 'px'}">
      <div v-for="item in menu.items" :style="{height: menu.itemHeight + 'px'}">{{item}}</div>
    </div>
  </div>
</template>

<script>
import fileTree from '@/components/v-filetree';

export default {
  components: {
    fileTree
  },
  props: {
    files: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      menu: {
        show: false,
        top: 0,
        left: 0,
        width: 100,
        itemHeight: 20,
        items: ['menu1', 'menu2', 'menu3']
      },
      scrollTop: 0,
      scrollLeft: 0
    };
  },
  methods: {
    loadFile (id) {
      this.$emit('loadFile', id);
    },
    scroll (e) {
      this.scrollTop = e.target.scrollTop;
      this.scrollLeft = e.target.scrollLeft;
    },
    leftClick (e) {
      this.menu.show = false;
    },
    rightClick (e) {
      const container = e.path.filter((item) => { return item.className === 'file-system'; })[0];
      const containerHeight = container.offsetHeight;
      const containerWidth = container.offsetWidth;
      this.menu.show = true;
      this.menu.top = e.clientY + this.scrollTop + 5;
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
  overflow-x: hidden;
  overflow-y: scroll;
  position: relative;
}
.menu {
  position: absolute;
  background: red;
  z-index: 1000;
}
</style>
