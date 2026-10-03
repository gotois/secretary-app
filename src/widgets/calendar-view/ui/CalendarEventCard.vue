<template>
  <QCard
    v-ripple
    flat
    :dark="!$q.dark.isActive"
    bordered
    square
    :tabindex="readOnly ? 0 : undefined"
    :role="readOnly ? 'button' : undefined"
    :aria-label="title"
    @keydown.enter.prevent="popup?.show()"
    @keydown.space.prevent="popup?.show()"
  >
    <QCardSection
      class="q-pa-xs justify-between items-center items-baseline"
      :horizontal="props.horizontal"
    >
      <div
        class="flex justify-between"
        :class="{
          'text-black': $q.dark.isActive,
          'text-white': !$q.dark.isActive,
        }"
      >
        <div class="text-subtitle2 text-bold">
          {{ title }}
        </div>
      </div>
      <div class="text-caption text-red ellipsis">
        ⏰
        {{ formatTime(start) }}
        -
        {{ formatTime(end) }}
      </div>
      <div
        v-if="location"
        class="ellipsis-2-lines text-caption"
      >
        📍 {{ location }}
      </div>
      <div
        v-if="description"
        class="ellipsis-2-lines"
      >
        {{ description }}
      </div>
      <div
        v-if="participant.length"
        class="ellipsis text-caption"
      >
        {{ participant.map((item) => item.name).join(', ') }}
      </div>
    </QCardSection>
    <QPopupProxy ref="popup">
      <TaskDetails
        v-if="readOnly"
        :title="title"
        :description="description || ''"
        :location="location"
        :start-time="eventDate(start)"
        :end-time="eventDate(end)"
        :timezone="timezone"
        :locale="locale"
        show-time
        plain-description
        style="width: min(640px, 90vw)"
      />
      <TaskFull
        v-else
        :style="{
          width: $q.platform.is.desktop ? '640px' : '320px',
        }"
        :event-id="eventId"
        :title="title"
        :description="description"
        :attaches="attaches"
        :start-time="eventDate(start)"
        :end-time="eventDate(end)"
        :tag="tag"
        :same-as="''"
        :location="location"
        :link="link"
        :organizer="organizer"
        :participant="participant"
        @edit="onEdit"
        @remove="onRemove"
      />
    </QPopupProxy>
  </QCard>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, ref, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { QCard, QCardSection, QPopupProxy, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TaskDetails from './TaskDetails.vue'
const TaskFull = defineAsyncComponent(() => import('./TaskFull.vue'))
import type { Agent } from '@/shared/model/contact'
import type { FormatImageType } from '@/shared/model/media'
import { ROUTE_NAMES } from '@/shared/config/routes'

const $q = useQuasar()
const i18n = useI18n()
const router = useRouter()

const $t = i18n.t

const emit = defineEmits(['remove'])

const popup = ref<InstanceType<typeof QPopupProxy>>()
const props = defineProps({
  readOnly: { type: Boolean, default: false },
  timezone: {
    type: String,
    default: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  locale: { type: String, default: () => navigator.language },
  horizontal: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  eventId: {
    type: String as PropType<string>,
    required: true,
  },
  title: {
    type: String as PropType<string>,
    required: true,
  },
  start: {
    type: Object as PropType<Temporal.PlainDate | Temporal.ZonedDateTime>,
    required: true,
  },
  end: {
    type: Object as PropType<Temporal.PlainDate | Temporal.ZonedDateTime>,
    required: true,
  },
  location: {
    type: String as PropType<string>,
    default: () => '',
  },
  description: {
    type: String as PropType<string>,
    default: null,
  },
  attaches: {
    type: Array as PropType<FormatImageType[]>,
    default: (): FormatImageType[] => [],
  },
  organizer: {
    type: Object as PropType<Agent>,
    default: (): Agent => ({ type: 'Person', name: '' }),
  },
  participant: {
    type: Array as PropType<Agent[]>,
    default: (): Agent[] => [],
  },
  tag: {
    type: Array as PropType<string[]>,
    default: (): string[] => [],
  },
  link: {
    type: String as PropType<string>,
    default: null,
  },
})

function eventDate(value: Temporal.PlainDate | Temporal.ZonedDateTime): Date {
  return new Date(
    'epochMilliseconds' in value
      ? value.epochMilliseconds
      : value.toZonedDateTime(props.timezone).epochMilliseconds,
  )
}
function formatTime(
  value: Temporal.PlainDate | Temporal.ZonedDateTime,
): string {
  return new Intl.DateTimeFormat(props.locale, {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(eventDate(value))
}
function onEdit() {
  if (props.readOnly) return
  void router.push({
    name: ROUTE_NAMES.EDIT,
    params: { taskId: props.eventId },
  })
}

function onRemove() {
  if (props.readOnly) return
  $q.notify({
    message: $t('contract.removeDialog.message'),
    type: 'negative',
    position: 'center',
    group: false,
    multiLine: true,
    textColor: 'white',
    timeout: 7500,
    attrs: {
      role: 'alertdialog',
    },
    actions: [
      {
        icon: 'check_circle',
        label: $t('contract.removeDialog.ok'),
        color: 'white',
        async handler() {
          try {
            const { useEventStore } = await import('@/features/event-editor')
            await useEventStore().deleteEvent({ uid_tasks: [props.eventId] })
            emit('remove')
          } catch (error) {
            console.error(error)
            $q.notify({
              type: 'negative',
              message: $t('contract.removeDialog.fail'),
            })
          }
        },
      },
      {
        icon: 'cancel',
        label: $t('contract.removeDialog.cancel'),
        color: 'white',
      },
    ],
  })
}
</script>
