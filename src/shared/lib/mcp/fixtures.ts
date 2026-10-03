export const FIXTURE_TITLE = 'Проверка UI Secretary'
export const RECURRENCE_TITLE = 'Повторяющаяся встреча'
export const FIXTURE_TIMEZONE = 'Europe/Moscow'

export function calendarFixture(day: string, empty = false): string {
  const date = day.replaceAll('-', '')
  const previous = new Date(`${day}T12:00:00Z`)
  previous.setUTCDate(previous.getUTCDate() - 1)
  const recurrenceDate = previous.toISOString().slice(0, 10).replaceAll('-', '')
  const entries = empty
    ? []
    : [
        'BEGIN:VEVENT',
        'UID:secretary-preview-event',
        `DTSTAMP:${date}T000000Z`,
        `DTSTART:${date}T120000Z`,
        `DTEND:${date}T123000Z`,
        `SUMMARY:${FIXTURE_TITLE}`,
        'DESCRIPTION:Тестовые данные локального MCP-хоста',
        'LOCATION:Офис',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:secretary-preview-recurring',
        `DTSTAMP:${recurrenceDate}T000000Z`,
        `DTSTART:${recurrenceDate}T130000Z`,
        `DTEND:${recurrenceDate}T133000Z`,
        'RRULE:FREQ=DAILY;COUNT=4',
        `SUMMARY:${RECURRENCE_TITLE}`,
        'END:VEVENT',
        'BEGIN:VFREEBUSY',
        'UID:secretary-preview-busy',
        `DTSTAMP:${date}T000000Z`,
        `DTSTART:${date}T140000Z`,
        `DTEND:${date}T143000Z`,
        `FREEBUSY;FBTYPE=BUSY:${date}T140000Z/${date}T143000Z`,
        'END:VFREEBUSY',
      ]
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Secretary//MCP Preview//RU',
    ...entries,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function calendarResult(day: string, empty = false) {
  return {
    content: [{ type: 'text' as const, text: 'Тестовый календарь Secretary' }],
    structuredContent: {
      view: 'calendar' as const,
      calendar: calendarFixture(day, empty),
      selectedDate: day,
      timezone: FIXTURE_TIMEZONE,
    },
  }
}
