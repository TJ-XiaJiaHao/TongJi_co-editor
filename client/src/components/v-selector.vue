<template>
  <div>
    <label v-if="title">{{ title }}</label>
    <select @change="onChange">
      <option v-for="(option, index) in selections" :key="option" :value="index">{{ option }}</option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String
    },
    selections: {
      type: Array,
      default: () => []
    }
  },

  mounted () {
  },

  methods: {
    onChange (evt) {
      this.$emit('change', evt.target.value)
    }
  }
}
</script>
