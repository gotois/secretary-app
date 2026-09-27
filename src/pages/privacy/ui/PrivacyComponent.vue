<template>
  <div
    class="privacy-content"
    v-html="html"
  />
</template>
<script lang="ts" setup>
import { onMounted } from 'vue'
import { ref } from 'vue'
import { parse } from '@/shared/lib/markdownHelper'

const html = ref('')

onMounted(async () => {
  const response = await fetch('docs/privacy.md')
  const md = await response.text()
  html.value = await parse(md)
})
</script>
<style scoped>
.privacy-content :deep(p) {
  white-space: pre-line;
}
</style>
