<template>
  <div>
    <!-- View mode -->
    <template v-if="readonly">
      <QCardSection>
        <p class="text-h6 q-mb-sm">
          {{ task.name }}
        </p>
        <div
          v-if="task.description"
          class="text-body2 text-grey q-mb-sm"
        >
          {{ task.description }}
        </div>
        <div class="text-caption q-mb-xs">
          <QIcon
            name="schedule"
            class="q-mr-xs"
          />
          {{ prettyDate(task.start_date, task.end_date) }}
        </div>
        <div
          v-if="task.location"
          class="text-caption q-mb-xs"
        >
          <QIcon
            name="place"
            class="q-mr-xs"
          />
          {{ task.location }}
        </div>
        <div
          v-if="task.link_meeting"
          class="text-caption q-mb-xs"
        >
          <QIcon
            name="videocam"
            class="q-mr-xs"
          />
          <a
            :href="task.link_meeting"
            target="_blank"
            rel="noopener"
          >
            {{ task.link_meeting }}
          </a>
        </div>
        <div class="text-caption">
          <QIcon
            name="flag"
            class="q-mr-xs"
          />
          {{ priorityLabel(task.priority) }}
        </div>
      </QCardSection>
      <QCardActions>
        <QBtn
          size="md"
          class="q-ml-auto q-mr-auto q-mt-none q-mb-none"
          round
          square
          flat
          icon="more_vert"
        >
          <QMenu
            transition-show="jump-down"
            transition-duration="200"
          >
            <QList
              bordered
              separator
              padding
              :dense="$q.platform.is.desktop"
            >
              <QItem
                v-close-popup
                clickable
                @click="onGoToEdit"
              >
                <QItemSection side>
                  <QItemLabel
                    overline
                    caption
                  >
                    {{ $t('archiveList.pod') }}
                  </QItemLabel>
                  <QItemLabel class="text-uppercase">
                    {{ $t('archiveList.edit') }}
                  </QItemLabel>
                </QItemSection>
              </QItem>
              <QItem
                v-close-popup
                clickable
                @click="onRemove"
              >
                <QItemSection side>
                  <QItemLabel
                    overline
                    caption
                  >
                    {{ $t('archiveList.pod') }}
                  </QItemLabel>
                  <QItemLabel class="text-negative text-uppercase">
                    {{ $t('archiveList.remove') }}
                  </QItemLabel>
                </QItemSection>
              </QItem>
            </QList>
          </QMenu>
        </QBtn>
      </QCardActions>
    </template>
    <!-- Edit mode -->
    <template v-else>
      <QForm
        ref="formRef"
        class="q-gutter-md"
        @submit="submit"
      >
        <QInput
          v-model="form.name"
          label="Название"
          outlined
          square
          hide-bottom-space
          :dense="$q.platform.is.desktop"
          :rules="[(v) => !!v || 'Обязательно']"
        />
        <QInput
          v-model="form.description"
          label="Описание"
          outlined
          square
          type="textarea"
          autogrow
          :dense="$q.platform.is.desktop"
        />
        <QInput
          v-model="form.start_date"
          label="Начало"
          outlined
          square
          mask="####-##-## ##:##"
          :dense="$q.platform.is.desktop"
        >
          <template #append>
            <QIcon
              name="event"
              class="cursor-pointer"
            >
              <QPopupProxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <QCard>
                  <QTabs
                    v-model="startDateTimeTab"
                    dense
                  >
                    <QTab
                      name="date"
                      label="Дата"
                    />
                    <QTab
                      name="time"
                      label="Время"
                    />
                  </QTabs>
                  <QSeparator />
                  <QTabPanels v-model="startDateTimeTab">
                    <QTabPanel
                      name="date"
                      class="q-pa-none"
                    >
                      <QDate
                        v-model="form.start_date"
                        mask="YYYY-MM-DD HH:mm"
                        minimal
                      />
                    </QTabPanel>
                    <QTabPanel
                      name="time"
                      class="q-pa-none"
                    >
                      <QTime
                        v-model="form.start_date"
                        mask="YYYY-MM-DD HH:mm"
                        format24h
                      />
                    </QTabPanel>
                  </QTabPanels>
                </QCard>
              </QPopupProxy>
            </QIcon>
          </template>
        </QInput>
        <QInput
          v-model="form.end_date"
          label="Конец"
          outlined
          square
          mask="####-##-## ##:##"
          :dense="$q.platform.is.desktop"
        >
          <template #append>
            <QIcon
              name="event"
              class="cursor-pointer"
            >
              <QPopupProxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <QCard>
                  <QTabs
                    v-model="endDateTimeTab"
                    dense
                  >
                    <QTab
                      name="date"
                      label="Дата"
                    />
                    <QTab
                      name="time"
                      label="Время"
                    />
                  </QTabs>
                  <QSeparator />
                  <QTabPanels v-model="endDateTimeTab">
                    <QTabPanel
                      name="date"
                      class="q-pa-none"
                    >
                      <QDate
                        v-model="form.end_date"
                        mask="YYYY-MM-DD HH:mm"
                        minimal
                      />
                    </QTabPanel>
                    <QTabPanel
                      name="time"
                      class="q-pa-none"
                    >
                      <QTime
                        v-model="form.end_date"
                        mask="YYYY-MM-DD HH:mm"
                        format24h
                      />
                    </QTabPanel>
                  </QTabPanels>
                </QCard>
              </QPopupProxy>
            </QIcon>
          </template>
        </QInput>
        <QSelect
          v-model="form.remind_before"
          :options="remindOptions"
          label="Напоминание"
          outlined
          square
          clearable
          emit-value
          map-options
          :dense="$q.platform.is.desktop"
        >
          <template #prepend>
            <QIcon name="notifications_none" />
          </template>
        </QSelect>
        <QInput
          v-model="form.location"
          label="Место"
          outlined
          square
          :dense="$q.platform.is.desktop"
        />
        <QInput
          v-model="form.link_meeting"
          label="Ссылка на встречу"
          outlined
          square
          type="url"
          :dense="$q.platform.is.desktop"
        />
        <QSelect
          v-model="form.target"
          :options="targetOptions"
          label="Кому"
          outlined
          square
          use-input
          use-chips
          multiple
          input-debounce="300"
          clearable
          behavior="menu"
          :loading="targetLoading"
          :dense="$q.platform.is.desktop"
          @filter="filterTargets"
          @clear="form.target = [ownTarget]"
        >
          <template #prepend>
            <QIcon name="group" />
          </template>
        </QSelect>
        <QSelect
          v-model="form.priority"
          :options="priorityOptions"
          label="Приоритет"
          outlined
          square
          emit-value
          map-options
          :dense="$q.platform.is.desktop"
        />
        <QCardActions
          v-if="!isTMA"
          class="q-px-none"
        >
          <QBtn
            type="submit"
            color="primary"
            icon="save"
            :label="taskId === null ? 'Создать' : 'Сохранить'"
            :loading="saving"
            :disable="saving"
          />
          <QSpace />
          <QBtn
            v-if="taskId !== null"
            flat
            color="negative"
            icon="delete"
            label="Удалить"
            :disable="saving"
            @click="onRemove"
          />
        </QCardActions>
      </QForm>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  QBtn,
  QCardActions,
  QCardSection,
  QDate,
  QForm,
  QIcon,
  QInput,
  QPopupProxy,
  QSelect,
  QSeparator,
  QSpace,
  QTab,
  QTabPanel,
  QTabPanels,
  QTabs,
  QTime,
  QItemLabel,
  QItemSection,
  QList,
  QCard,
  QItem,
  QMenu,
} from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import { isTMA } from '@/shared/lib/detector'
import useEventStore from '../model/store'
import { prettyDate, toDatetimeLocal } from '@/shared/lib/dateHelper'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { useModal } from '@/shared/lib/useModal'

interface TaskObject {
  id_task: number
  chatId?: number
  messageId?: number
  targetName?: string
  targetType?: 'Group' | 'Person'
  name: string
  description?: string | null
  start_date: string
  end_date?: string | null
  location?: string | null
  link_meeting?: string | null
  priority?: number
  id_category?: number
  id_cal_class?: number
  estimated_unix_time?: number
  notification_date_time?: string | null
  remind_before?: number | null
}

interface TargetOption {
  label: string
  value: {
    type: 'Group' | 'Person'
    id: number
    name: string
    messageId?: number
  } | null
}

const props = defineProps<{
  task: TaskObject
  readonly: boolean
  taskId: null | number | string
}>()
const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'removed'): void
}>()

const $q = useQuasar()
const modal = useModal()
useI18n()
const router = useRouter()
const route = useRoute()
const eventStore = useEventStore()

const formRef = ref<InstanceType<typeof QForm> | null>(null)
const saving = ref(false)
const targetLoading = ref(false)
const ownTarget: TargetOption = {
  label: 'Себе',
  value: null,
}
const telegramTargetType =
  props.task.targetType === 'Group' ? 'Group' : 'Person'
const telegramTargetName =
  props.task.targetName || `${telegramTargetType} ${props.task.chatId}`
const telegramTarget: TargetOption | undefined =
  typeof props.task.chatId === 'number'
    ? {
        label: telegramTargetName,
        value: {
          type: telegramTargetType,
          id: props.task.chatId,
          name: telegramTargetName,
          messageId: props.task.messageId,
        },
      }
    : undefined
const targetOptions = ref<TargetOption[]>(
  telegramTarget ? [ownTarget, telegramTarget] : [ownTarget],
)
const startDateTimeTab = ref('date')
const endDateTimeTab = ref('date')
const priorityOptions = [
  { label: 'Высокий', value: 1 },
  { label: 'Средний', value: 2 },
  { label: 'Низкий', value: 3 },
]
const defaultRemindOptions = [
  { label: 'Без напоминания', value: null },
  { label: 'За 15 мин', value: 15 },
  { label: 'За 1 час', value: 60 },
  { label: 'За 24 часа', value: 1440 },
]
const taskRemindBefore =
  typeof props.task.remind_before === 'number'
    ? Math.floor(props.task.remind_before) / 60
    : null
const notificationDate = props.task.notification_date_time
  ? new Date(props.task.notification_date_time)
  : null
const currentReminderOption =
  taskRemindBefore !== null &&
  notificationDate &&
  !Number.isNaN(notificationDate.getTime())
    ? {
        label: new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(notificationDate),
        value: taskRemindBefore,
      }
    : null
const remindOptions = currentReminderOption
  ? [
      currentReminderOption,
      ...defaultRemindOptions.filter(
        (option) => option.value !== currentReminderOption.value,
      ),
    ]
  : defaultRemindOptions
const isNew = props.taskId === null

function priorityLabel(priority?: number): string {
  return priorityOptions.find((o) => o.value === priority)?.label ?? '—'
}

async function filterTargets(
  value: string,
  update: (callback: () => void) => void,
) {
  const query = value.trim()

  if (!query) {
    targetLoading.value = false
    update(() => {
      targetOptions.value = [ownTarget]
    })
    return
  }

  targetLoading.value = true
  try {
    const groups = await eventStore.getTelegramGroups(query)

    update(() => {
      targetOptions.value = groups.map((group) => ({
        label: group.title,
        value: {
          type: 'Group',
          id: group.id,
          name: group.title,
        },
      }))
    })
  } catch (error) {
    console.error(error)
  } finally {
    targetLoading.value = false
  }
}

const form = reactive<Omit<TaskObject, 'id_task'> & { target: TargetOption[] }>(
  {
    name: props.task.name || 'Новое событие',
    description: props.task.description,
    start_date: toDatetimeLocal(props.task.start_date).replace('T', ' '),
    end_date: toDatetimeLocal(props.task.end_date).replace('T', ' '),
    location: props.task.location,
    link_meeting: props.task.link_meeting,
    priority: props.task.priority ?? 2,
    targetType: telegramTargetType,
    remind_before: taskRemindBefore,
    target: [telegramTarget ?? ownTarget],
  },
)

watch(
  () => form.start_date,
  (startDate) => {
    if (!startDate) {
      return
    }
    const endDate = new Date(startDate.replace(' ', 'T'))
    if (Number.isNaN(endDate.getTime())) {
      return
    }

    endDate.setHours(endDate.getHours() + 1)
    form.end_date = toDatetimeLocal(endDate.toISOString()).replace('T', ' ')
  },
)

function onGoToEdit() {
  void router.push({
    name: ROUTE_NAMES.EDIT,
    params: {
      taskId: props.taskId,
    },
    query: route.query,
  })
}

async function onSave(): Promise<void> {
  if (saving.value) {
    return
  }
  saving.value = true
  try {
    const valid = await formRef.value?.validate()
    if (!valid) {
      return
    }
    await eventStore.createEvent({
      id_category: props.task.id_category,
      id_cal_class: props.task.id_cal_class,
      estimated_unix_time: props.task.estimated_unix_time,
      name: form.name,
      description: form.description || undefined,
      start_date: new Date(form.start_date),
      end_date: form.end_date ? new Date(form.end_date) : undefined,
      location: form.location || undefined,
      link_meeting: form.link_meeting || undefined,
      target: form.target.map((target) => target.value),
      priority: form.priority,
      remind_before: form.remind_before,
    })
    emit('saved')
  } catch (error: unknown) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка сохранения',
    })
    throw error
  } finally {
    saving.value = false
  }
}

async function onEdit(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    const startDate = new Date(form.start_date)
    await eventStore.editEvent({
      ...(typeof props.taskId === 'string' && !/^\d+$/.test(props.taskId)
        ? { uid_task: props.taskId }
        : { id_task: Number(props.taskId) }),
      name: form.name,
      description: form.description || undefined,
      start_date: startDate,
      end_date: form.end_date ? new Date(form.end_date) : undefined,
      location: form.location || undefined,
      link_meeting: form.link_meeting || undefined,
      priority: form.priority,
      remind_before: form.remind_before,
      target: form.target.map((target) => target.value),
    })
    emit('saved')
    await router.replace({
      name: ROUTE_NAMES.CALENDAR,
      hash: '#' + Temporal.Instant.from(startDate.toISOString()).toString(),
    })
  } catch (error: unknown) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка обновления',
    })
    throw error
  } finally {
    saving.value = false
  }
}

async function submit(): Promise<void> {
  if (isNew) {
    await onSave()
  } else {
    await onEdit()
  }
}

defineExpose({
  submit,
})

async function removeTask(): Promise<void> {
  try {
    await eventStore.deleteEvent({
      id_tasks: [props.task.id_task],
    })
    emit('removed')
  } catch (error: unknown) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Ошибка удаления',
    })
  }
}

async function onRemove() {
  if (await modal.confirm(`Удалить событие?\n«${props.task.name}»`)) {
    await removeTask()
  }
}
</script>
