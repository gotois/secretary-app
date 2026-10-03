<template>
  <QCard
    flat
    square
    bordered
  >
    <div class="row">
      <div
        class="column q-pl-md q-pb-sm"
        style="max-width: calc(100% - 45px)"
      >
        <p
          class="full-width q-pt-md text-subtitle1 text-uppercase text-weight-bold no-margin"
          :class="{
            'q-pb-md': !description,
            'q-pb-none': description && !$q.platform.is.desktop,
            'ellipsis': $q.platform.is.desktop,
          }"
        >
          {{ title }}
          <QTooltip>{{ title }}</QTooltip>
        </p>
        <div
          v-if="description && !plainDescription"
          class="full-width text-caption q-pb-md text-grey no-margin"
          v-html="parse(description)"
        />
      </div>
    </div>
    <p
      v-if="description && plainDescription"
      class="q-px-md"
      style="white-space: pre-wrap"
      >{{ description }}</p
    >
    <slot name="attachments" />
    <QSeparator />
    <QCardSection>
      <slot name="actions" />
      <div class="flex content-center text-overline no-margin q-pt-sm">
        <QIcon
          style="align-self: center"
          class="q-pr-xs"
          :name="isPast ? 'history_toggle_off' : 'schedule'"
          :color="isPast ? 'negative' : 'orange-9'"
        />
        <span :class="isPast ? 'text-negative' : 'text-orange-9'">
          {{ dateLabel }}
        </span>
      </div>
      <div
        v-if="organizer"
        class="row items-center"
      >
        <div
          class="flex overflow-hidden text-left ellipsis"
          style="left: 32px; right: 0"
        >
          <QIcon :name="organizer.type === 'Organization' ? 'group' : 'face'" />
          <div>
            {{ organizer.name }}
            {{ organizer.email }}
          </div>
        </div>
      </div>
      <div
        v-if="participant?.length"
        class="row items-center"
      >
        <div
          class="flex overflow-hidden text-left ellipsis"
          style="left: 32px; right: 0"
        >
          <QIcon :name="participant.length > 1 ? 'group' : 'face'" />
          <span
            v-for="({ url, name, email }, index) in participant"
            :key="index"
          >
            {{ name }} {{ url }} {{ email }}
          </span>
        </div>
      </div>
      <div>
        {{ link }}
      </div>
      <div
        v-if="location"
        class="row items-center q-gutter-xs"
      >
        <QIcon name="place" />
        <span>{{ location }}</span>
      </div>
      <slot name="tags" />
    </QCardSection>
  </QCard>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import {
  useQuasar,
  QCard,
  QCardSection,
  QIcon,
  QSeparator,
  QTooltip,
} from 'quasar'
import { parse } from '@/shared/lib/markdownHelper'
import type { Agent } from '@/shared/model/contact'

const props = withDefaults(
  defineProps<{
    title: string
    startTime: Date
    endTime?: Date | null
    description?: string
    plainDescription?: boolean
    location?: string | null
    timezone?: string
    locale?: string
    showTime?: boolean
    organizer?: Agent
    participant?: Agent[]
    link?: string
  }>(),
  {
    description: '',
    showTime: false,
    participant: () => [],
    link: '',
  },
)

const $q = useQuasar()
const isPast = computed(
  () => props.endTime != null && props.endTime < new Date(),
)
const dateLabel = computed(() => {
  if (
    Number.isNaN(props.startTime.getTime()) ||
    (props.endTime != null && Number.isNaN(props.endTime.getTime()))
  ) {
    return ''
  }
  const formatter = new Intl.DateTimeFormat(props.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(props.timezone ? { timeZone: props.timezone } : {}),
    ...(props.showTime
      ? ({ hour: '2-digit', minute: '2-digit' } as const)
      : {}),
  })
  const start = formatter.format(props.startTime)
  return props.endTime == null
    ? start
    : `${start} — ${formatter.format(props.endTime)}`
})
</script>
