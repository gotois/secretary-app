<template>
  <McpCalendarView v-if="isMcpApp" />
  <ScheduleCalendarView v-else />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { isMcpApp } from '@/shared/lib/detector'
import ScheduleCalendarView from './ScheduleCalendarView.vue'

const McpCalendarView = defineAsyncComponent(() =>
  import('./McpCalendarView.vue').then(({ default: component }) => component),
)
</script>
