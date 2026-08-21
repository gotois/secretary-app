<template>
  <QPage :class="$q.dark.isActive ? 'bg-transparent' : 'bg-grey-1'">
    <QScrollArea
      visible
      class="absolute-full fit"
    >
      <QCard
        draggable="false"
        flat
        square
        bordered
        :style="{
          'max-width': $q.platform.is.desktop ? '720px' : '600px',
        }"
        class="q-pa-md q-ml-auto q-mr-auto q-mt-md q-mb-md"
      >
        <CalendarEventFormComponent
          ref="formRef"
          :task="emptyTask"
          :readonly="false"
          :task-id="null"
          @saved="onSaved"
        />
      </QCard>
    </QScrollArea>
  </QPage>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, h, onMounted, ref } from 'vue'
import {
  useQuasar,
  useMeta,
  QPage,
  QCard,
  QScrollArea,
  QSkeleton,
} from 'quasar'
import { useI18n } from 'vue-i18n'
import { mainButton, postEvent } from '@tma.js/sdk'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { isMcpApp, isTMA } from '@/shared/lib/detector'
import { useEventStore } from '@/features/event-editor'
import { useHostBridge } from '@/shared/lib/mcp/hostBridge'

const CalendarEventFormComponent = defineAsyncComponent({
  loader: () => import('@/features/event-editor'),
  delay: 0,
  loadingComponent: h(QSkeleton, { style: { height: '460px' } }),
})

const $q = useQuasar()
const $t = useI18n().t
const router = useRouter()
const eventStore = useEventStore()
const bridge = useHostBridge()
const formRef = ref<{ submit: () => Promise<void> } | null>(null)

interface EmptyTask {
  id_task: number
  targetType: 'Group' | 'Person'
  name: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  link_meeting: string | null
  priority: number
}

function _now() {
  if (!isMcpApp.value) {
    const d = new Date()
    d.setSeconds(0, 0)
    return d.toISOString()
  }
  // todo зачем здесь подключается целый store для этого непонятно
  eventStore.applyMcpContent()
  const date = eventStore.mcpSelectedDate
  const d = new Date(
    `${date}T${String(new Date().getHours()).padStart(2, '0')}:00:00`,
  )
  d.setSeconds(0, 0)
  return d.toISOString()
}

function _nowPlusHour() {
  // todo - сомнительно почему был убран const d = new Date(Date.now() + 3_600_000)
  const d = new Date(new Date(_now()).getTime() + 3_600_000)
  d.setSeconds(0, 0)
  return d.toISOString()
}

const emptyTask: EmptyTask = {
  id_task: 0,
  targetType: 'Person',
  name: '',
  description: null,
  start_date: _now(),
  end_date: _nowPlusHour(),
  location: null,
  link_meeting: null,
  priority: 3,
}

async function onSaved() {
  $q.notify({ type: 'positive', message: $t('pages.calendar.title') })
  if (isMcpApp.value) {
    await bridge.requestClose()
    return
  }
  await router.replace({ name: ROUTE_NAMES.CALENDAR })
}

useMeta({
  title: $t('pages.calendar.title'),
})

onMounted(() => {
  if (!isTMA.value) {
    return
  }
  if (!mainButton.isMounted()) {
    mainButton.mount()
  }
  mainButton.setParams({
    text: 'Создать',
    bgColor: '#2481cc',
    textColor: '#ffffff',
    isEnabled: true,
    isVisible: true,
  })
  mainButton.onClick(async () => {
    await formRef.value?.submit()
    postEvent('web_app_close')
  })
})
</script>
