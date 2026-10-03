import { createCalendar, createViewDay } from '@schedule-x/calendar'
import type { CalendarApp } from '@schedule-x/calendar'
import { createCurrentTimePlugin } from '@schedule-x/current-time'
import { createScrollControllerPlugin } from '@schedule-x/scroll-controller'
import { createIcalendarPlugin } from '@schedule-x/ical'
import {
  getBusyBackgroundEvents,
  getCalendarSubscriptionStatus,
} from '@/shared/lib/calendarFeed'
import type { CalendarContent } from '@/shared/lib/calendarFeed'

export function createCalendarView(
  content: CalendarContent & { busyTitle?: string },
  locale: string,
  dark: boolean,
  onContentChange?: (hasContent: boolean) => void,
  plugins: Parameters<typeof createCalendar>[0]['plugins'] = [],
) {
  getCalendarSubscriptionStatus(content.calendar)
  const feed = createIcalendarPlugin({ data: content.calendar })
  // Keep the original UID for browser actions, including recurring instances.
  const converters = feed as unknown as {
    icalEventToSXEvent: (event: { uid: string }) => {
      _foreignProperties?: Record<string, unknown>
    }
    icalOccurrenceToSXEvent: (occurrence: { item: { uid: string } }) => {
      _foreignProperties?: Record<string, unknown>
    }
  }
  const convertEvent = converters.icalEventToSXEvent
  converters.icalEventToSXEvent = (event) => {
    const result = convertEvent.call(feed, event)
    result._foreignProperties = {
      ...result._foreignProperties,
      taskUid: event.uid,
    }
    return result
  }
  const convertOccurrence = converters.icalOccurrenceToSXEvent
  if (convertOccurrence)
    converters.icalOccurrenceToSXEvent = (occurrence) => {
      const result = convertOccurrence.call(feed, occurrence)
      result._foreignProperties = {
        ...result._foreignProperties,
        taskUid: occurrence.item.uid,
      }
      return result
    }
  let initialScroll = Temporal.Now.plainTimeISO(content.timezone).toString({
    smallestUnit: 'minute',
  })
  if (window.location.hash) {
    try {
      initialScroll = Temporal.Instant.from(
        decodeURIComponent(window.location.hash.slice(1)),
      )
        .toZonedDateTimeISO(content.timezone)
        .toPlainTime()
        .toString({ smallestUnit: 'minute' })
    } catch {
      // An invalid fragment keeps the default scroll to the current time.
    }
  }
  const scroll = createScrollControllerPlugin({ initialScroll })
  const selectedDate = Temporal.PlainDate.from(
    content.selectedDate || Temporal.Now.plainDateISO(content.timezone),
  )
  const backgrounds = getBusyBackgroundEvents(
    content.calendar,
    content.timezone,
    content.busyTitle || 'Занят',
  )
  function publishContent(
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
  ) {
    const hasBusy = backgrounds.some(
      (event) =>
        event.start.epochMilliseconds < end.epochMilliseconds &&
        event.end.epochMilliseconds > start.epochMilliseconds,
    )
    onContentChange?.(calendar.events.getAll().length > 0 || hasBusy)
  }
  const calendar: CalendarApp = createCalendar({
    views: [createViewDay()],
    theme: 'shadcn',
    locale,
    timezone: content.timezone,
    isDark: dark,
    selectedDate,
    events: [],
    backgroundEvents: backgrounds,
    firstDayOfWeek: 1,
    isResponsive: false,
    plugins: [
      createCurrentTimePlugin({ fullWeekWidth: false }),
      feed,
      scroll,
      ...plugins,
    ],
    callbacks: {
      onRangeUpdate(range) {
        feed.between(range.start, range.end)
        publishContent(range.start, range.end)
      },
      onRender() {
        scroll.scrollTo(initialScroll)
        const start = selectedDate.toZonedDateTime(content.timezone)
        publishContent(start, start.add({ days: 1 }))
      },
    },
  })
  return calendar
}
