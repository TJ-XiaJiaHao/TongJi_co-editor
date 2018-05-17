<template>
  <div class="file-tree-content">
    <div v-for="file in files" :key="file.id" class="file-tree-block">
      <div class="file-tree-title" @click="fileClick(file)"  :class="{'type-folder': file.children, 'type-file': !file.children }" :id="file.id">
        <img :src="file.showChildren ? downArrow : rightArrow" v-if="file.children" class="arrow"/>
        <span class="arrow" v-else></span>
        <span class="file-name ">{{file.name}}</span>
      </div>
      <div class="file-tree-child" v-if="file.showChildren">
        <fileTree v-if="file.children" :files="file.children" @loadFile="loadFile"></fileTree>
      </div>
    </div>
  </div>
</template>
<script>
import downArrow from './../assets/down-arrow.png';
import rightArrow from './../assets/right-arrow.png';
export default {
  name: 'fileTree',
  props: {
    files: {
      type: Array
    }
  },
  data () {
    return {
      downArrow,
      rightArrow
    };
  },
  methods: {
    fileClick (file) {
      if (file.children) file.showChildren = !file.showChildren;
      else this.$emit('loadFile', file.id);
    },
    loadFile (id) {
      this.$emit('loadFile', id);
    }
  }
};
</script>
<style>
.file-tree-content {
  width: 100%;
  text-align: left;
}
.file-tree-child {
  width: 100%;
  padding-left: 20px;
}
.file-tree-title {
  padding-top: 5px;
}
.arrow {
  width: 15px;
  height: 15px;
  display: inline-block;
}
.file-name {
  vertical-align: top;
}
</style>
