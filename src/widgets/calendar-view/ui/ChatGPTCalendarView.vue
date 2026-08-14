<template>
  <main
    v-if="!bridge.isAvailable"
    class="chatgpt-unavailable column flex-center q-pa-lg text-center"
  >
    <QIcon
      name="error_outline"
      color="negative"
      size="48px"
    />
    <h1 class="text-h6 q-mb-sm"> Среда ChatGPT недоступна </h1>
    <p class="text-body2 text-grey-7">
      Откройте приложение повторно из ChatGPT.
    </p>
  </main>
  <section
    v-else-if="messageModal"
    class="chatgpt-message-modal column q-pa-lg"
  >
    <p class="text-body1 q-mb-lg chatgpt-message-modal__text">
      {{ messageModal.message }}
    </p>
    <div class="row justify-end q-gutter-sm">
      <QBtn
        v-if="messageModal.mode === 'confirm'"
        flat
        label="Отмена"
        @click="completeMessageModal(false)"
      />
      <QBtn
        color="primary"
        label="OK"
        @click="completeMessageModal(true)"
      />
    </div>
  </section>
  <section
    v-else
    class="chatgpt-calendar q-pa-md"
  >
    <template v-if="createDraft">
      <div class="text-h6 q-mb-xs">Проверьте задачу</div>
      <div class="text-caption text-grey-7 q-mb-md">
        При необходимости измените поля, затем подтвердите создание.
      </div>
      <CalendarEventFormComponent
        :task="createDraft"
        :readonly="false"
        :task-id="null"
        @saved="onDraftSaved"
      />
    </template>

    <QBanner
      v-else-if="createdTask"
      class="bg-positive text-white"
      rounded
    >
      <div class="text-subtitle1">Задача создана</div>
      <div class="text-body1 q-mt-sm">{{ createdTask.name }}</div>
      <div class="text-caption">
        {{ taskTime(createdTask) }}
        <template v-if="createdTask.location">
          · {{ createdTask.location }}
        </template>
      </div>
    </QBanner>

    <template v-else>
      <header class="row items-center no-wrap q-gutter-sm q-mb-md">
        <QBtn
          flat
          round
          dense
          icon="chevron_left"
          aria-label="Предыдущий день"
          :disable="loading || writing"
          @click="moveDay(-1)"
        />
        <QInput
          v-model="selectedDate"
          class="col"
          type="date"
          dense
          outlined
          square
          :disable="loading || writing"
          @update:model-value="loadSelectedDay"
        />
        <QBtn
          flat
          round
          dense
          icon="chevron_right"
          aria-label="Следующий день"
          :disable="loading || writing"
          @click="moveDay(1)"
        />
      </header>

      <div class="q-mb-sm">
        <div>
          <div class="text-h6">
            {{ formattedDate }}
          </div>
          <div class="text-caption text-grey-7">
            {{ eventStore.chatGPTTimezone }}
          </div>
        </div>
      </div>

      <QBanner
        v-if="eventStore.chatGPTStale"
        class="bg-warning text-dark q-mb-md"
        rounded
      >
        Изменение сохранено, но список не обновлён.
        <template #action>
          <QBtn
            flat
            label="Повторить"
            :loading="loading"
            @click="loadSelectedDay"
          />
        </template>
      </QBanner>

      <QBanner
        v-if="modalError"
        class="bg-negative text-white q-mb-md"
        rounded
      >
        {{ modalError }}
        <template #action>
          <QBtn
            flat
            color="white"
            label="Открыть здесь"
            @click="openFallback"
          />
        </template>
      </QBanner>

      <div
        v-if="loading"
        class="column items-center q-pa-xl"
      >
        <QSpinner
          color="primary"
          size="42px"
        />
      </div>

      <QBanner
        v-else-if="loadError"
        class="bg-negative text-white"
        rounded
      >
        {{ loadError }}
        <template #action>
          <QBtn
            flat
            color="white"
            label="Повторить"
            @click="loadSelectedDay"
          />
        </template>
      </QBanner>

      <div
        v-else-if="!eventStore.chatGPTTasks.length"
        class="column items-center q-pa-xl text-grey-7"
      >
        <QIcon
          name="event_available"
          size="48px"
        />
        <p class="q-mt-md q-mb-none"> На этот день задач нет </p>
      </div>

      <QList
        v-else
        bordered
        separator
        class="rounded-borders"
      >
        <QItem
          v-for="task in eventStore.chatGPTTasks"
          :key="task.id_task"
          clickable
          @click="openTask('view', task)"
        >
          <QItemSection avatar>
            <QIcon
              name="schedule"
              color="primary"
            />
          </QItemSection>
          <QItemSection>
            <QItemLabel>{{ task.name }}</QItemLabel>
            <QItemLabel caption>
              {{ taskTime(task) }}
              <template v-if="task.location"> · {{ task.location }} </template>
            </QItemLabel>
          </QItemSection>
          <QItemSection side>
            <div class="row no-wrap">
              <QBtn
                flat
                round
                dense
                icon="edit"
                aria-label="Редактировать"
                :disable="writing"
                @click.stop="openTask('edit', task)"
              />
              <QBtn
                flat
                round
                dense
                color="negative"
                icon="delete"
                aria-label="Удалить"
                :loading="writingTaskId === task.id_task"
                :disable="writing"
                @click.stop="removeTask(task)"
              />
            </div>
          </QItemSection>
        </QItem>
      </QList>
    </template>

    <QDialog
      v-model="fallbackOpen"
      square
      @hide="fallbackTask = null"
    >
      <QCard class="chatgpt-fallback-card">
        <QCardSection class="row items-center">
          <div class="text-h6">
            {{ fallbackTitle }}
          </div>
          <QSpace />
          <QBtn
            v-close-popup
            flat
            round
            dense
            icon="close"
          />
        </QCardSection>
        <QSeparator />
        <QCardSection>
          <CalendarEventFormComponent
            v-if="fallbackTask"
            :task="fallbackTask"
            :readonly="fallbackMode === 'view'"
            :task-id="fallbackMode === 'create' ? null : fallbackTask.id_task"
            @saved="closeFallback"
            @removed="closeFallback"
          />
        </QCardSection>
      </QCard>
    </QDialog>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import {
  QBanner,
  QBtn,
  QCard,
  QCardSection,
  QDialog,
  QIcon,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QList,
  QSeparator,
  QSkeleton,
  QSpace,
  QSpinner,
} from 'quasar'
import { useEventStore } from '@/features/event-editor'
import {
  isChatGPTMessageModalState,
  useHostBridge,
  type ChatGPTTaskModalState,
  type ChatGPTTask,
} from '@/shared/lib/hostBridge'
import {
  getChatGPTModalChannelName,
  type ChatGPTModalResult,
  useModal,
} from '@/shared/lib/useModal'

const CalendarEventFormComponent = defineAsyncComponent({
  loader: () => import('@/features/event-editor'),
  delay: 0,
  loadingComponent: h(QSkeleton, { style: { height: '460px' } }),
})

const bridge = useHostBridge()
const modal = useModal()
const eventStore = useEventStore()
const messageModal = computed(() =>
  isChatGPTMessageModalState(bridge.toolInput) ? bridge.toolInput : null,
)
const initialContent = bridge.toolOutput || bridge.widgetState?.content
const loading = ref(false)
const loadError = ref<string | null>(null)
const modalError = ref<string | null>(null)
const pendingFallback = ref<ChatGPTTaskModalState | null>(null)
const fallbackOpen = ref(false)
const fallbackMode = ref<ChatGPTTaskModalState['mode']>('view')
const fallbackTask = ref<ChatGPTTask | null>(null)
const writingTaskId = ref<number | null>(null)
const createDraft = ref<ChatGPTTask | null>(
  initialContent?.view === 'create-form'
    ? initialContent.tasks?.[0] || null
    : null,
)
const createdTask = ref<ChatGPTTask | null>(null)
let unsubscribe = () => {}
let messageModalSettled = false

const writing = computed(() => writingTaskId.value !== null)
const selectedDate = computed({
  get: () => eventStore.chatGPTSelectedDate,
  set: (value: string) => {
    eventStore.chatGPTSelectedDate = value
  },
})
const locale = computed(() => bridge.locale || 'ru-RU')
const formattedDate = computed(() => {
  const date = new Date(`${selectedDate.value}T12:00:00`)
  return new Intl.DateTimeFormat(locale.value, {
    timeZone: eventStore.chatGPTTimezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
})
const fallbackTitle = computed(() => {
  if (fallbackMode.value === 'create') {
    return 'Новая задача'
  }
  if (fallbackMode.value === 'edit') {
    return 'Редактирование'
  }
  return 'Задача'
})

function taskTime(task: ChatGPTTask): string {
  const format = new Intl.DateTimeFormat(locale.value, {
    timeZone: eventStore.chatGPTTimezone,
    hour: '2-digit',
    minute: '2-digit',
  })
  const start = format.format(new Date(task.start_date))
  if (!task.end_date) {
    return start
  }
  return `${start}–${format.format(new Date(task.end_date))}`
}

function emptyTask(): ChatGPTTask {
  const now = new Date()
  const isToday =
    eventStore.chatGPTSelectedDate ===
    new Intl.DateTimeFormat('en-CA', {
      timeZone: eventStore.chatGPTTimezone,
    }).format(now)
  const hour = isToday ? now.getHours() + 1 : 9
  const start = new Date(`${eventStore.chatGPTSelectedDate}T00:00:00`)
  start.setHours(hour, 0, 0, 0)
  const end = new Date(start.getTime() + 3_600_000)
  return {
    id_task: 0,
    targetType: 'Person',
    name: '',
    description: null,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    location: null,
    link_meeting: null,
    priority: 3,
  }
}

async function loadSelectedDay(): Promise<void> {
  if (!selectedDate.value) {
    return
  }
  loading.value = true
  loadError.value = null
  try {
    await eventStore.showChatGPTEvents(selectedDate.value)
  } catch (error) {
    console.error(error)
    loadError.value =
      error instanceof Error ? error.message : 'Не удалось загрузить задачи'
  } finally {
    loading.value = false
  }
}

async function moveDay(delta: number): Promise<void> {
  const date = new Date(`${selectedDate.value}T12:00:00`)
  date.setDate(date.getDate() + delta)
  selectedDate.value = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  await loadSelectedDay()
}

function setFallback(
  mode: ChatGPTTaskModalState['mode'],
  task?: ChatGPTTask,
): void {
  fallbackMode.value = mode
  fallbackTask.value = task ? { ...task } : emptyTask()
  fallbackOpen.value = true
}

function openFallback(): void {
  if (!pendingFallback.value) {
    return
  }
  const task = pendingFallback.value.taskId
    ? eventStore.chatGPTTasks.find(
        (item) => item.id_task === pendingFallback.value?.taskId,
      )
    : undefined
  setFallback(pendingFallback.value.mode, task)
  modalError.value = null
}

async function openTask(
  mode: ChatGPTTaskModalState['mode'],
  task?: ChatGPTTask,
): Promise<void> {
  const params: ChatGPTTaskModalState = {
    mode,
    taskId: task?.id_task,
  }
  pendingFallback.value = params
  modalError.value = null
  try {
    const opened = await bridge.requestModal(params)
    if (!opened) {
      setFallback(mode, task)
    }
  } catch (error) {
    console.error(error)
    modalError.value =
      error instanceof Error ? error.message : 'Не удалось открыть окно'
  }
}

async function removeTask(task: ChatGPTTask): Promise<void> {
  if (
    writing.value ||
    !(await modal.confirm(`Удалить событие?\n«${task.name}»`))
  ) {
    return
  }
  writingTaskId.value = task.id_task
  loadError.value = null
  try {
    await eventStore.deleteEvent({ id_tasks: [task.id_task] })
  } catch (error) {
    console.error(error)
    loadError.value =
      error instanceof Error ? error.message : 'Не удалось удалить задачу'
  } finally {
    writingTaskId.value = null
  }
}

function closeFallback(): void {
  fallbackOpen.value = false
}

function onDraftSaved(): void {
  createdTask.value = eventStore.chatGPTTasks[0] || createDraft.value
  createDraft.value = null
}

function publishMessageModalResult(confirmed: boolean): void {
  if (!messageModal.value || messageModalSettled) {
    return
  }
  messageModalSettled = true
  const result: ChatGPTModalResult = {
    requestId: messageModal.value.requestId,
    confirmed,
  }
  const channel = new BroadcastChannel(
    getChatGPTModalChannelName(messageModal.value.requestId),
  )
  channel.postMessage(result)
  channel.close()
}

function completeMessageModal(confirmed: boolean): void {
  publishMessageModalResult(confirmed)
  void bridge.requestClose().catch((error) => console.error(error))
}

function onPageHide(): void {
  publishMessageModalResult(false)
}

onMounted(async () => {
  if (!bridge.isAvailable) {
    return
  }
  if (messageModal.value) {
    window.addEventListener('pagehide', onPageHide, { passive: true })
    return
  }
  const hydrated = eventStore.applyChatGPTContent(initialContent)
  if (!hydrated) {
    await loadSelectedDay()
  }
  unsubscribe = bridge.subscribe(() => {
    const content = bridge.widgetState?.content || bridge.toolOutput
    eventStore.applyChatGPTContent(content)
    if (
      !createdTask.value &&
      content?.view === 'create-form' &&
      content.tasks?.[0]
    ) {
      createDraft.value = content.tasks[0]
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', onPageHide)
  publishMessageModalResult(false)
  unsubscribe()
})
</script>

<style scoped>
.chatgpt-calendar {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.chatgpt-message-modal {
  min-width: min(420px, calc(100vw - 32px));
}

.chatgpt-message-modal__text {
  white-space: pre-line;
}

.chatgpt-fallback-card {
  width: min(640px, calc(100vw - 32px));
  max-height: 90vh;
  overflow: auto;
}
</style>

<style>
.chatgpt-unavailable {
  min-height: 240px;
}

html.chatgpt-host,
html.chatgpt-host body,
html.chatgpt-host #q-app {
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
}

html.chatgpt-host .q-layout,
html.chatgpt-host .q-page-container,
html.chatgpt-host .q-page {
  min-height: 0 !important;
}
</style>
