<template>
  <div class="file-tree-content">
    <div v-for="file in files" :key="file.name" class="file-tree-block">
      <div>
        <img :src="file.showChildren ? downArrow : rightArrow" v-if="file.children" class="arrow"/>
        {{file.name}}
      </div>
      <div class="file-tree-child" v-if="file.showChildren">
        <fileTree v-if="file.children" :files="file.children"></fileTree>
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
.arrow {
  width: 30px;
  height: 20px;
}
</style>
