import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { CalendarApp } from '@schedule-x/calendar'
import type { CalendarContent } from '@/shared/lib/calendarFeed'
import { getBusyBackgroundEvents } from '@/shared/lib/calendarFeed'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import { createCalendarView } from './calendar'
import { calendarResult } from '@/shared/lib/mcp/fixtures'

const calendars: CalendarApp[] = []
const originalUrl = window.location.href
const originalScroll = HTMLElement.prototype.scroll
beforeEach(() => {
  HTMLElement.prototype.scroll = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  for (const calendar of calendars.splice(0)) calendar.destroy()
  window.history.replaceState(null, '', originalUrl)
  vi.restoreAllMocks()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  HTMLElement.prototype.scroll = originalScroll
})

function renderCalendar(calendar: CalendarApp) {
  calendars.push(calendar)
  const root = document.createElement('div')
  document.body.append(root)
  calendar.render(root)
  return root
}

describe('shared Schedule-X calendar', () => {
  test('scrolls the real time grid to the URL fragment on render', async () => {
    window.history.replaceState(null, '', '/calendar#2026-10-01T06:30:00Z')
    const calendar = createCalendarView(
      {
        ...calendarResult('2026-10-01').structuredContent,
        timezone: 'Europe/Moscow',
      },
      'en-US',
      false,
    )
    renderCalendar(calendar)
    await vi.waitFor(() =>
      expect(HTMLElement.prototype.scroll).toHaveBeenCalled(),
    )
    const position = vi.mocked(HTMLElement.prototype.scroll).mock.calls.at(-1)!
    expect(position[0]).toBe(0)
    expect(position[1]).toBeCloseTo((9.5 / 24) * 1600)
  })

  test.each(['', '#invalid', '#%'])(
    'uses the current time for fragment %s',
    async (hash) => {
      window.history.replaceState(null, '', '/calendar' + hash)
      vi.spyOn(Temporal.Now, 'plainTimeISO').mockReturnValue(
        Temporal.PlainTime.from('12:00'),
      )
      renderCalendar(
        createCalendarView(
          calendarResult('2026-10-01').structuredContent,
          'en-US',
          false,
        ),
      )
      await vi.waitFor(() =>
        expect(HTMLElement.prototype.scroll).toHaveBeenCalled(),
      )
      const position = vi
        .mocked(HTMLElement.prototype.scroll)
        .mock.calls.at(-1)!
      expect(position[0]).toBe(0)
      expect(position[1]).toBeCloseTo(800)
    },
  )

  test('uses native Temporal for selection, busy periods and calendar controls', () => {
    const content = calendarResult('2026-10-01').structuredContent
    const busy = getBusyBackgroundEvents(
      content.calendar,
      content.timezone,
      'Busy',
    )
    expect(busy[0]!.start).toBeInstanceOf(Temporal.ZonedDateTime)
    expect(busy[0]!.end).toBeInstanceOf(Temporal.ZonedDateTime)
    const controls = createCalendarControlsPlugin()
    const calendar = createCalendarView(content, 'en-US', false, undefined, [
      controls,
    ])
    renderCalendar(calendar)
    expect(controls.getDate()).toBeInstanceOf(Temporal.PlainDate)
    controls.setDate(Temporal.PlainDate.from('2026-10-02'))
    expect(controls.getDate().toString()).toBe('2026-10-02')
  })

  test('expands recurrence and displays VFREEBUSY using the real ICS plugin', async () => {
    const calendar = createCalendarView(
      calendarResult('2026-10-01').structuredContent,
      'ru-RU',
      false,
    )
    const root = renderCalendar(calendar)
    await vi.waitFor(() => expect(calendar.events.getAll()).toHaveLength(2))
    expect(calendar.events.getAll().map((event) => event.title)).toEqual(
      expect.arrayContaining([
        'Проверка UI Secretary',
        'Повторяющаяся встреча',
      ]),
    )
    expect(calendar.events.getAll().map((event) => event.taskUid)).toEqual(
      expect.arrayContaining([
        'secretary-preview-event',
        'secretary-preview-recurring',
      ]),
    )
    const recurrence = calendar.events
      .getAll()
      .find((event) => event.title === 'Повторяющаяся встреча')!
    expect(recurrence.start.toString()).toContain('2026-10-01T13:00')
    expect(recurrence.end.toString()).toContain('2026-10-01T13:30')
    await vi.waitFor(() =>
      expect(
        root.querySelector('.sx__time-grid-background-event[title="Занят"]'),
      ).not.toBeNull(),
    )
  })

  test('keeps event instants unchanged when displayed across the DST transition', async () => {
    const result = calendarResult('2026-03-29', true).structuredContent
    const calendar = createCalendarView(
      {
        ...result,
        timezone: 'Europe/Berlin',
        calendar: [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Secretary//Test//EN',
          'BEGIN:VEVENT',
          'UID:dst-event',
          'DTSTAMP:20260329T000000Z',
          'DTSTART:20260329T003000Z',
          'DTEND:20260329T013000Z',
          'SUMMARY:DST event',
          'END:VEVENT',
          'END:VCALENDAR',
          '',
        ].join('\r\n'),
      },
      'en-GB',
      true,
    )
    renderCalendar(calendar)
    await vi.waitFor(() => expect(calendar.events.getAll()).toHaveLength(1))
    const event = calendar.events.getAll()[0]!
    expect((event.start as Temporal.ZonedDateTime).toInstant().toString()).toBe(
      '2026-03-29T00:30:00Z',
    )
    expect((event.end as Temporal.ZonedDateTime).toInstant().toString()).toBe(
      '2026-03-29T01:30:00Z',
    )
    expect(
      (event.start as Temporal.ZonedDateTime).withTimeZone('Europe/Berlin')
        .hour,
    ).toBe(1)
    expect(
      (event.end as Temporal.ZonedDateTime).withTimeZone('Europe/Berlin').hour,
    ).toBe(3)
    expect(calendar.getTheme()).toBe('dark')
  })

  test('renders a valid empty feed without inventing events', () => {
    const calendar = createCalendarView(
      {
        ...calendarResult('2026-10-01', true).structuredContent,
        calendar: [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Secretary//Secretary Calendar TG//en',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'END:VCALENDAR',
          '',
        ].join('\n'),
      },
      'ru-RU',
      false,
    )
    renderCalendar(calendar)
    expect(calendar.events.getAll()).toEqual([])
  })

  test('reports no visible content when the full feed contains only other days', async () => {
    const onContentChange = vi.fn<(hasContent: boolean) => void>()
    const calendar = createCalendarView(
      {
        ...calendarResult('2026-10-01').structuredContent,
        selectedDate: '2026-10-10',
      },
      'ru-RU',
      false,
      onContentChange,
    )
    renderCalendar(calendar)
    await vi.waitFor(() =>
      expect(onContentChange).toHaveBeenLastCalledWith(false),
    )
    expect(calendar.events.getAll()).toEqual([])
  })

  test.each([
    ['2026-10-01', true],
    ['2026-10-02', false],
  ])(
    'counts busy-only content only when it overlaps the selected day %s',
    async (selectedDate, expectedContent) => {
      const onContentChange = vi.fn<(hasContent: boolean) => void>()
      const calendar = createCalendarView(
        {
          view: 'calendar',
          timezone: 'Europe/Moscow',
          selectedDate,
          calendar: [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Secretary//Test//EN',
            'BEGIN:VFREEBUSY',
            'UID:busy-window',
            'DTSTAMP:20261001T000000Z',
            'DTSTART:20261001T120000Z',
            'DTEND:20261001T130000Z',
            'FREEBUSY;FBTYPE=BUSY:20261001T120000Z/20261001T130000Z',
            'END:VFREEBUSY',
            'END:VCALENDAR',
            '',
          ].join('\r\n'),
        },
        'ru-RU',
        false,
        onContentChange,
      )
      const root = renderCalendar(calendar)
      await vi.waitFor(() =>
        expect(onContentChange).toHaveBeenLastCalledWith(expectedContent),
      )
      expect(calendar.events.getAll()).toEqual([])
      if (expectedContent) {
        await vi.waitFor(() =>
          expect(
            root.querySelector('.sx__time-grid-background-event'),
          ).not.toBeNull(),
        )
      }
    },
  )

  test('honors recurrence exclusions and moved instances instead of duplicating them', async () => {
    const content: CalendarContent = {
      ...calendarResult('2026-10-02', true).structuredContent,
      calendar: [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Secretary//Test//EN',
        'BEGIN:VEVENT',
        'UID:recurring-meeting',
        'DTSTAMP:20261001T000000Z',
        'DTSTART:20261001T120000Z',
        'DTEND:20261001T123000Z',
        'RRULE:FREQ=DAILY;COUNT=4',
        'EXDATE:20261003T120000Z',
        'SUMMARY:Regular meeting',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:recurring-meeting',
        'DTSTAMP:20261001T000000Z',
        'RECURRENCE-ID:20261002T120000Z',
        'DTSTART:20261002T140000Z',
        'DTEND:20261002T143000Z',
        'SUMMARY:Moved meeting',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    }
    const calendar = createCalendarView(content, 'en-GB', false)
    renderCalendar(calendar)
    await vi.waitFor(() => expect(calendar.events.getAll()).toHaveLength(1))
    const event = calendar.events.getAll()[0]!
    expect(event.title).toBe('Moved meeting')
    expect(event.start.toString()).toContain('2026-10-02T14:00')
    const excluded = createCalendarView(
      { ...content, selectedDate: '2026-10-03' },
      'en-GB',
      false,
    )
    renderCalendar(excluded)
    expect(excluded.events.getAll()).toEqual([])
  })
})
