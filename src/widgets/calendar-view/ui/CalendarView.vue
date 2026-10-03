<template>
  <ScheduleCalendarView
    :key="router.currentRoute.value.hash"
    :calendar="calendarSubscription"
    :timezone="geoStore.timeZone"
    :locale="langStore.language"
    :selected-date="selectedDate"
    :loading="isPending || isFetching"
    :error="error"
    @refresh="refetch()"
  />
</template>
<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ScheduleCalendarView from './ScheduleCalendarView.vue'
import useGeoStore from '@/shared/model/geo'
import useLangStore from '@/shared/model/lang'
import useCalendarSubscriptionQuery from '@/features/calendar-subscription'
import useWebPush from '@/features/web-push'
import { isTMA } from '@/shared/lib/detector'

const geoStore = useGeoStore()
const langStore = useLangStore()
const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()
const {
  data: calendarSubscription,
  isPending,
  isFetching,
  error,
  refetch,
} = useCalendarSubscriptionQuery()
const fragmentMoment = computed(() => {
  const hash = router.currentRoute.value.hash
  if (!hash) return undefined
  try {
    return Temporal.Instant.from(
      decodeURIComponent(hash.slice(1)),
    ).toZonedDateTimeISO(geoStore.timeZone)
  } catch {
    return undefined
  }
})
const selectedDate = computed(() => {
  if (fragmentMoment.value) return fragmentMoment.value.toPlainDate().toString()
  const value = router.currentRoute.value.query.date
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? undefined
    : Temporal.Instant.fromEpochMilliseconds(date.getTime())
        .toZonedDateTimeISO(geoStore.timeZone)
        .toPlainDate()
        .toString()
})
const { permission, enable } = useWebPush()
onBeforeMount(() => {
  if (!isTMA.value && permission.value === 'default') {
    $q.notify({
      position: 'top-right',
      timeout: 0,
      message: t('webPush.requestMessage'),
      actions: [
        {
          label: t('webPush.enableButton'),
          color: 'white',
          handler: () => {
            void enable()
          },
        },
        { icon: 'close', color: 'white', round: true },
      ],
    })
  }
})
const metaData = {
  'title': t('pages.calendar.title'),
  'og:title': t('pages.calendar.title'),
}
useMeta(metaData)
</script>
