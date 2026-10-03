<template>
  <QBtn
    :color="color"
    square
    unelevated
    class="q-ml-xs q-mr-xs"
  >
    <div
      :class="{
        'text-grey-9': !$q.dark.isActive,
        'text-black-8': $q.dark.isActive,
      }"
    >
      {{
        new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          timeZone: timezone,
        }).format(props.day)
      }}
    </div>
    <div
      class="text-bold text-center"
      :class="{
        'text-grey-9': !$q.dark.isActive,
        'text-black-8': $q.dark.isActive,
      }"
    >
      {{ dayDate.day }}
    </div>
    <QTooltip
      anchor="bottom middle"
      self="bottom middle"
    >
      {{ dayDate.toString() }}
    </QTooltip>
  </QBtn>
</template>
<script lang="ts" setup>
import { PropType, computed } from 'vue'
import { useQuasar, QBtn, QTooltip } from 'quasar'

const $q = useQuasar()

const props = defineProps({
  locale: { type: String, default: () => navigator.language },
  timezone: {
    type: String,
    default: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  day: {
    type: Date as PropType<Date>,
    required: true,
  },
  selectedDay: {
    type: String as PropType<string>,
    default: null,
  },
})

const dayDate = computed(() =>
  Temporal.Instant.fromEpochMilliseconds(props.day.getTime())
    .toZonedDateTimeISO(props.timezone)
    .toPlainDate(),
)

const color = computed(() => {
  if (props.selectedDay && dayDate.value.toString() === props.selectedDay) {
    return 'green-6'
  } else if (dayDate.value.equals(Temporal.Now.plainDateISO(props.timezone))) {
    return $q.dark.isActive ? 'yellow-10' : 'yellow-9'
  }
  return 'transparent'
})
</script>
