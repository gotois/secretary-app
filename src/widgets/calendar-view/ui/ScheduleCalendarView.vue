<template>
  <QPage
    class="column no-wrap"
    :style-fn="calendarPageStyle"
    :class="{
      'bg-transparent': $q.dark.isActive,
      'bg-white': !$q.dark.isActive,
    }"
    :style="{
      'max-width': $q.platform.is.desktop ? '720px' : 'auto',
    }"
  >
    <div
      class="calendar-header flex full-width items-center justify-between shadow-4 no-wrap"
      :class="{
        'bg-white': !$q.dark.isActive,
        'bg-dark': $q.dark.isActive,
      }"
    >
      <QBtn
        icon="arrow_left"
        flat
        fab
        square
        :dense="$q.platform.is.desktop"
        :color="$q.dark.isActive ? 'light' : 'dark'"
        aria-label="Предыдущая неделя"
        :disable="loading"
        @click="moveWeek(-1)"
      />
      <QVirtualScroll
        ref="virtualScroll"
        v-slot="{ item, index }"
        class="col q-mt-xs q-mb-xs"
        :items="weeks"
        virtual-scroll-horizontal
      >
        <DayCalendar
          :key="index"
          style="width: 44px"
          class="cursor-pointer q-ml-xs q-mr-xs q-pa-md rounded-borders relative-position non-selectable flex items-center justify-center"
          :day="item"
          :timezone="timezone"
          :locale="locale"
          :selected-day="selectedDay"
          :disable="loading"
          @click="selectDay(item)"
        />
      </QVirtualScroll>
      <QBtn
        icon="arrow_right"
        flat
        fab
        square
        :dense="$q.platform.is.desktop"
        :color="$q.dark.isActive ? 'light' : 'dark'"
        aria-label="Следующая неделя"
        :disable="loading"
        @click="moveWeek(1)"
      />
    </div>

    <div
      v-if="calendarLoadError && readOnly && calendarApp"
      role="status"
      class="text-negative q-pa-sm"
    >
      {{ calendarLoadError }}
      <QBtn
        flat
        :label="$t('pages.calendar.retry')"
        :disable="loading"
        @click="emit('refresh')"
      />
    </div>
    <QScrollArea
      ref="scrollAreaRef"
      :visible="$q.platform.is.desktop"
      :delay="500"
      :content-style="{ height: '100%' }"
      :content-active-style="{ height: '100%' }"
      class="calendar-scroll full-width"
    >
      <QPullToRefresh
        ref="pullToRefreshRef"
        class="calendar-pull-to-refresh absolute-full fit"
        scroll-target=".sx__view-container"
        @refresh="onRefresh"
      >
        <ScheduleXCalendar
          v-if="calendarApp && (!calendarLoadError || readOnly)"
          :key="calendarRevision"
          :calendar-app="calendarApp"
        >
          <template #dateGridEvent="{ calendarEvent }">
            <CalendarEventCard
              class="fit"
              :event-id="calendarEvent.taskUid"
              :read-only="readOnly"
              :timezone="timezone"
              :locale="locale"
              :title="calendarEvent.title"
              :description="calendarEvent.description"
              :start="calendarEvent.start"
              :end="calendarEvent.end"
              :location="calendarEvent.location"
              :attaches="calendarEvent.attaches"
              :tag="calendarEvent.tag"
              :organizer="calendarEvent.organizer"
              :participant="calendarEvent.participant"
              :link="calendarEvent.link"
              @remove="onRemove(calendarEvent.title)"
            />
          </template>
          <template #timeGridEvent="{ calendarEvent }">
            <CalendarEventCard
              class="fit"
              horizontal
              :event-id="calendarEvent.taskUid"
              :read-only="readOnly"
              :timezone="timezone"
              :locale="locale"
              :title="calendarEvent.title"
              :description="calendarEvent.description"
              :start="calendarEvent.start"
              :end="calendarEvent.end"
              :location="calendarEvent.location"
              :attaches="calendarEvent.attaches"
              :tag="calendarEvent.tag"
              :organizer="calendarEvent.organizer"
              :participant="calendarEvent.participant"
              :link="calendarEvent.link"
              @remove="onRemove(calendarEvent.title)"
            />
          </template>
        </ScheduleXCalendar>
        <div
          v-else-if="calendarLoadError"
          class="absolute-full column flex-center q-gutter-md"
          data-test="calendar-error"
        >
          <h1 class="text-negative text-center text-weight-light no-padding">
            {{ $t('pages.calendar.loadError') }}
            <small v-if="readOnly">{{ calendarLoadError }}</small>
          </h1>
          <QBtn
            color="accent"
            square
            glossy
            push
            :label="$t('pages.calendar.retry')"
            :loading="loading"
            :disable="loading"
            data-test="calendar-retry"
            @click="emit('refresh')"
          />
        </div>
        <div
          v-else-if="loading"
          class="absolute-full flex flex-center"
        >
          <QSpinner size="5em" />
        </div>
      </QPullToRefresh>
    </QScrollArea>
  </QPage>
</template>
<script lang="ts" setup>
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import {
  useQuasar,
  QVirtualScroll,
  QScrollArea,
  QPage,
  QBtn,
  QPullToRefresh,
  QSpinner,
} from 'quasar'
import { useI18n } from 'vue-i18n'
import { ScheduleXCalendar } from '@schedule-x/vue'
import type { CalendarApp } from '@schedule-x/calendar'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import DayCalendar from './DayCalendar.vue'
import CalendarEventCard from './CalendarEventCard.vue'
import { createCalendarView } from '../lib/calendar'
import { getCalendarSubscriptionStatus } from '@/shared/lib/calendarFeed'
import '@schedule-x/theme-shadcn/dist/index.css'

const props = defineProps<{
  calendar?: string
  timezone: string
  locale: string
  selectedDate?: string
  loading?: boolean
  error?: unknown
  readOnly?: boolean
}>()
const emit = defineEmits<{
  refresh: []
  selectDate: [day: string]
}>()
const $q = useQuasar()
const { t: $t } = useI18n()
const calendarApp = shallowRef<CalendarApp>()
const calendarRevision = ref(0)
const calendarControls = createCalendarControlsPlugin()
const localError = shallowRef<unknown>()
const calendarLoadError = computed(() => props.error || localError.value)
const selectedDay = ref(
  props.selectedDate || Temporal.Now.plainDateISO(props.timezone).toString(),
)
const weeks = ref<Date[]>([])
const virtualScroll = ref<InstanceType<typeof QVirtualScroll>>()
const scrollAreaRef = ref<InstanceType<typeof QScrollArea>>()
const pullToRefreshRef = ref<InstanceType<typeof QPullToRefresh>>()

function calendarPageStyle(offset: number, height: number) {
  return {
    height: `${Math.max(0, height - offset)}px`,
    minHeight: '0px',
  }
}

function loadWeek(day: string) {
  const date = Temporal.PlainDate.from(day)
  const monday = date.subtract({ days: date.dayOfWeek - 1 })
  weeks.value = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        monday.add({ days: index }).toZonedDateTime(props.timezone)
          .epochMilliseconds,
      ),
  )
}
watch(
  [
    () => props.calendar,
    () => props.timezone,
    () => props.locale,
    () => props.selectedDate,
    () => $q.dark.isActive,
  ],
  () => {
    try {
      if (props.selectedDate) selectedDay.value = props.selectedDate
      loadWeek(selectedDay.value)
      if (props.calendar === undefined) return
      localError.value = undefined
      getCalendarSubscriptionStatus(props.calendar)
      calendarApp.value = createCalendarView(
        {
          busyTitle: $t('pages.calendar.busy'),
          view: 'calendar',
          calendar: props.calendar,
          timezone: props.timezone,
          selectedDate: selectedDay.value,
        },
        props.locale,
        $q.dark.isActive,
        undefined,
        [calendarControls],
      )
      calendarRevision.value++
      void nextTick(() => {
        pullToRefreshRef.value?.updateScrollTarget()
        virtualScroll.value?.scrollTo(
          Temporal.PlainDate.from(selectedDay.value).dayOfWeek - 1,
        )
      })
    } catch (error) {
      calendarApp.value = undefined
      localError.value = error
    }
  },
  { immediate: true },
)
function moveWeek(direction: number) {
  selectDay(
    new Date(
      Temporal.PlainDate.from(selectedDay.value)
        .add({ weeks: direction })
        .toZonedDateTime(props.timezone).epochMilliseconds,
    ),
  )
}
function selectDay(day: Date) {
  selectedDay.value = Temporal.Instant.fromEpochMilliseconds(day.getTime())
    .toZonedDateTimeISO(props.timezone)
    .toPlainDate()
    .toString()
  loadWeek(selectedDay.value)
  if (calendarApp.value)
    calendarControls.setDate(Temporal.PlainDate.from(selectedDay.value))
  emit('selectDate', selectedDay.value)
}
function onRefresh(done: () => void) {
  emit('refresh')
  done()
}
function onRemove(name: string) {
  scrollAreaRef.value?.setScrollPosition('vertical', 0, 150)
  $q.notify({
    type: 'positive',
    message: $t('pages.calendar.removeSuccess', { name }),
  })
}
</script>
<style lang="scss" scoped>
.calendar-header {
  flex: 0 0 auto;
  min-height: 64px;
}
.calendar-header > .q-virtual-scroll {
  min-width: 0;
}
:deep(.calendar-header .q-virtual-scroll__content) {
  margin-inline: auto;
}
.calendar-scroll {
  flex: 1;
  min-height: 0;
}
::-webkit-scrollbar {
  height: 0;
  background: transparent;
}
:deep(.sx-vue-calendar-wrapper) {
  height: 100%;
  max-width: 100%;

  ::-webkit-scrollbar {
    height: 0;
    background: transparent;
  }
}
:deep(.calendar-pull-to-refresh > .q-pull-to-refresh__content) {
  height: 100%;
}
:deep(.sx__calendar) {
  border: none;
}
:deep(.sx__week-grid__date-axis) {
  display: none;
}
:deep(.sx__calendar-header) {
  display: none;
}
:deep(.sx__date-grid-cell) {
  height: clamp(80px, 1.25rem, 24px) !important;
}
</style>
