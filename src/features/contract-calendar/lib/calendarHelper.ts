import { date } from 'quasar'
import ICalendar, { VEvent } from 'ical-browser'
import type { Event } from 'ical-browser'
import { formatIcal } from '@/shared/lib/dateHelper'
import type { ContractTable } from '@/entities/contract'
import type { CalendarEventExternal } from '../model/types'

export function createCal(id: string, obj: { event: Event }): File {
  const ev = new VEvent(obj.event)
  const calendar = new ICalendar({ id })
  calendar.addEvent(ev)
  return calendar.download('calendar.ics')
}

type GoogleCalendarParams = {
  text: string
  details?: string
  startTime: Date
  endTime?: Date
  location: string
}

export function googleCalendarUrl(o: GoogleCalendarParams) {
  const link = new URL('https://calendar.google.com/calendar/render')
  link.searchParams.append('action', 'TEMPLATE')
  link.searchParams.append('text', o.text)
  link.searchParams.append('details', o.details ?? '')
  if (o.endTime) {
    link.searchParams.append(
      'dates',
      formatIcal(o.startTime) + '/' + formatIcal(o.endTime),
    )
  } else {
    link.searchParams.append(
      'dates',
      formatIcal(o.startTime) + '/' + formatIcal(o.startTime),
    )
  }
  if (location) {
    link.searchParams.append('location', o.location)
  }
  return link
}

export function formatToCalendarDate(elem: Date | string = new Date()) {
  return Temporal.PlainDate.from(date.formatDate(elem, 'YYYY-MM-DD'))
}

export function isCurrentDate(
  elem: Date | string,
  now: Date | string = new Date(),
) {
  return date.isSameDate(elem, now, 'day')
}

export function formatCalendarDateTime(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const values = Object.fromEntries(
    parts.map(({ type, value: partValue }) => [type, partValue]),
  )

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`
}

export function taskOverlapsRange(
  task: ContractTable,
  from: Date,
  to: Date,
): boolean {
  const start = task.startTime.getTime()
  const end = (task.endTime ?? task.startTime).getTime()

  return start <= to.getTime() && end >= from.getTime()
}

export function taskToCalendarEvent(
  task: ContractTable,
  timeZone: string,
): CalendarEventExternal {
  const endTime = task.endTime ?? task.startTime

  return {
    id: task.id,
    start: formatCalendarDateTime(task.startTime, timeZone),
    end: formatCalendarDateTime(endTime, timeZone),
    title: task.name,
    calendarId: 'secretary',
    description: task.description,
    attaches: task.attachment,
    tag: task.tag,
    organizer: task.organizer,
    participant: task.participant,
    location: task.location,
    link: task.link,
  }
}
