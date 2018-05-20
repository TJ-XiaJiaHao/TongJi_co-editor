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

    </div>
  </div>
</template>
<script>
import addIcon from './../assets/add.png';
import deleteIcon from './../assets/delete.png';
import projectIcon from './../assets/project.png';
import renameIcon from './../assets/rename.png';
import settingIcon from './../assets/setting.png';
export default {
  props: {
    selections: {
      type: Array
    }
  },
  data () {
    return {
      addIcon,
      deleteIcon,
      projectIcon,
      renameIcon,
      settingIcon
    };
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
</style>
