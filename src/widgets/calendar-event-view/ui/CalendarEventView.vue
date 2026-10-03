<template>
  <QPage :class="$q.dark.isActive ? 'bg-transparent' : 'bg-grey-1'">
    <QScrollArea
      visible
      class="absolute-full fit"
    >
      <QPullToRefresh
        class="absolute-full fit"
        @refresh="onRefresh"
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
            v-if="task"
            ref="formRef"
            :task="task as any"
            :readonly="isViewMode"
            :task-id="props.taskId"
            @saved="onSaved"
            @removed="onRemoved"
          />
        </QCard>
        <QSpace class="q-pb-xs" />
      </QPullToRefresh>
    </QScrollArea>
  </QPage>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, h, ref, computed, watch, onMounted } from 'vue'
import {
  useQuasar,
  useMeta,
  QPage,
  QSpace,
  QSkeleton,
  QPullToRefresh,
  QCard,
  QScrollArea,
} from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mainButton } from '@tma.js/sdk'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { useEventStore } from '@/features/event-editor'
import { isTMA } from '@/shared/lib/detector'

const CalendarEventFormComponent = defineAsyncComponent({
  loader: () => import('@/features/event-editor'),
  delay: 0,
  loadingComponent: h(QSkeleton, { style: { height: '460px' } }),
})

const props = defineProps<{
  taskId: string
}>()

const $q = useQuasar()
const $t = useI18n().t
const router = useRouter()
const route = useRoute()
const eventStore = useEventStore()
const formRef = ref<{ submit: () => Promise<void> } | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const task = ref<Record<string, any> | null>(null)

const isViewMode = computed(() => route.name === ROUTE_NAMES.VIEW)

watch(
  () => isViewMode.value,
  (viewMode) => {
    if (!isTMA.value) {
      return
    }
    mainButton.setParams({
      isVisible: !viewMode,
    })
  },
)

const metaData = {
  'title': $t('pages.calendar.title'),
  'og:title': $t('pages.calendar.title'),
}

async function onRefresh(done: () => void) {
  try {
    task.value = await eventStore.getEvent(props.taskId)
  } catch (err) {
    console.error(err)
  } finally {
    done()
  }
}

function onSaved() {
  $q.notify({ type: 'positive', message: 'Сохранено' })
}

async function onRemoved() {
  $q.notify({ type: 'positive', message: 'Удалено' })
  await router.push({ path: '/', replace: true })
}

onMounted(async () => {
  $q.loading.show()
  try {
    task.value = await eventStore.getEvent(props.taskId)
  } catch (error: unknown) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: (error as Error)?.message ?? 'Ошибка загрузки',
    })
    await router.push({ path: '/', replace: true })
  } finally {
    $q.loading.hide()
  }
})

useMeta(metaData)

onMounted(() => {
  if (!isTMA.value) {
    return
  }
  if (!mainButton.isMounted()) {
    mainButton.mount()
  }
  mainButton.setParams({
    text: 'Обновить',
    bgColor: '#2481cc',
    textColor: '#ffffff',
    isEnabled: true,
    isVisible: !isViewMode.value,
  })
  mainButton.onClick(async () => {
    await formRef.value?.submit()
  })
})
</script>
