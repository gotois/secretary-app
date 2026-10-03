export interface CalendarContent {
  view: 'calendar'
  calendar: string
  selectedDate?: string
  timezone: string
}

import type { BackgroundEvent } from '@schedule-x/calendar'

export type CalendarSubscriptionStatus = 'empty' | 'ready'

type BusyType = 'BUSY' | 'BUSY-TENTATIVE' | 'BUSY-UNAVAILABLE'

type BusyBackgroundEvent = BackgroundEvent & {
  start: Temporal.ZonedDateTime
  end: Temporal.ZonedDateTime
}

const busyStyles: Record<BusyType, BackgroundEvent['style']> = {
  'BUSY': {
    background: 'rgba(244, 67, 54, 0.16)',
  },
  'BUSY-TENTATIVE': {
    background:
      'repeating-linear-gradient(45deg, rgba(255, 193, 7, 0.22), rgba(255, 193, 7, 0.22) 6px, transparent 6px, transparent 12px)',
  },
  'BUSY-UNAVAILABLE': {
    background:
      'repeating-linear-gradient(45deg, rgba(97, 97, 97, 0.2), rgba(97, 97, 97, 0.2) 6px, transparent 6px, transparent 12px)',
  },
}

function unfoldLines(source: string): string[] {
  const lines: string[] = []
  for (const line of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line.trim())
    }
  }
  return lines.filter(Boolean)
}

function parseBusyType(property: string): BusyType | null {
  const value = property
    .split(';')
    .slice(1)
    .find((parameter) => parameter.toUpperCase().startsWith('FBTYPE='))
    ?.split('=', 2)[1]
    ?.toUpperCase()

  if (value === 'BUSY-TENTATIVE' || value === 'BUSY-UNAVAILABLE') {
    return value
  }
  if (value === 'FREE') {
    return null
  }
  return 'BUSY'
}

function parseUtcDateTime(
  value: string,
  timeZone: string,
): Temporal.ZonedDateTime | null {
  const match =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z$/.exec(value)
  if (!match) {
    return null
  }
  const [, year, month, day, hour, minute, second, fraction] = match
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${
    fraction ? `.${fraction}` : ''
  }Z`
  return Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone)
}

export function getBusyBackgroundEvents(
  source: string,
  timeZone: string,
  title: string,
): BusyBackgroundEvent[] {
  const events: BusyBackgroundEvent[] = []
  let insideFreeBusy = false

  for (const line of unfoldLines(source)) {
    const separator = line.indexOf(':')
    if (separator < 0) {
      continue
    }
    const property = line.slice(0, separator)
    const value = line.slice(separator + 1)
    const propertyName = property.split(';', 1)[0]?.toUpperCase()

    if (propertyName === 'BEGIN' && value.toUpperCase() === 'VFREEBUSY') {
      insideFreeBusy = true
      continue
    }
    if (propertyName === 'END' && value.toUpperCase() === 'VFREEBUSY') {
      insideFreeBusy = false
      continue
    }
    if (!insideFreeBusy || propertyName !== 'FREEBUSY') {
      continue
    }

    const busyType = parseBusyType(property)
    if (!busyType) {
      continue
    }
    for (const period of value.split(',')) {
      const [startValue, endValue] = period.split('/', 2)
      const start = startValue ? parseUtcDateTime(startValue, timeZone) : null
      const end = endValue ? parseUtcDateTime(endValue, timeZone) : null
      if (!start || !end || end.epochMilliseconds <= start.epochMilliseconds) {
        continue
      }
      events.push({
        start,
        end,
        title,
        style: busyStyles[busyType],
      })
    }
  }

  return events
}

export function getCalendarSubscriptionStatus(
  source: string,
): CalendarSubscriptionStatus {
  const components: string[] = []
  let hasCalendar = false
  let hasDisplayContent = false

  for (const line of unfoldLines(source)) {
    const separator = line.indexOf(':')
    if (separator < 0) {
      throw new Error('Invalid calendar subscription')
    }
    const property = line.slice(0, separator)
    const value = line.slice(separator + 1).toUpperCase()
    const propertyName = property.split(';', 1)[0]?.toUpperCase()

    if (propertyName === 'BEGIN') {
      if (!value || (components.length === 0 && value !== 'VCALENDAR')) {
        throw new Error('Invalid calendar subscription')
      }
      if (value === 'VCALENDAR') {
        if (components.length > 0 || hasCalendar) {
          throw new Error('Invalid calendar subscription')
        }
        hasCalendar = true
      }
      if (value === 'VEVENT') {
        hasDisplayContent = true
      }
      components.push(value)
      continue
    }

    if (propertyName === 'END') {
      if (!value || components.pop() !== value) {
        throw new Error('Invalid calendar subscription')
      }
      continue
    }

    if (components.length === 0) {
      throw new Error('Invalid calendar subscription')
    }
    if (
      propertyName === 'FREEBUSY' &&
      components.at(-1) === 'VFREEBUSY' &&
      parseBusyType(property) &&
      value
    ) {
      hasDisplayContent = true
    }
  }

  if (!hasCalendar || components.length > 0) {
    throw new Error('Invalid calendar subscription')
  }

  return hasDisplayContent ? 'ready' : 'empty'
}
