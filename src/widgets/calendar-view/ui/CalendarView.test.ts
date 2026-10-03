/* eslint-disable vue/one-component-per-file */
import { defineComponent } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, describe, expect, test, vi } from 'vitest'

const quasarMock = vi.hoisted(() => ({
  loading: { show: vi.fn(), hide: vi.fn() },
  notify: vi.fn(),
  dark: { isActive: false },
  platform: {
    has: { webStorage: true },
    is: { desktop: false },
    isDesktop: false,
  },
}))
const originalUrl = window.location.href
const routeMock = vi.hoisted(() => ({ hash: '', query: {} }))

const icalendarPluginMocks = vi.hoisted(
  (): Array<{
    between: ReturnType<typeof vi.fn>
    icalEventToSXEvent: (event: { uid: string }) => {
      id: string
      _foreignProperties?: Record<string, unknown>
    }
  }> => [],
)

vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useMeta: vi.fn(),
    useQuasar: () => quasarMock,
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: { value: routeMock },
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/shared/lib/databaseService', () => ({
  db: {
    getContractNames: vi.fn(async () => new Map()),
  },
}))

vi.mock('@/shared/lib/detector', async () => {
  const { computed } = await import('vue')
  return { isTMA: computed(() => false) }
})

vi.mock('@/features/web-push', async () => {
  const { ref } = await import('vue')
  return {
    default: () => ({
      permission: ref<NotificationPermission>('denied'),
      enable: vi.fn(),
    }),
  }
})

vi.mock('./DayCalendar.vue', () => ({
  default: { name: 'DayCalendar', template: '<div />' },
}))

vi.mock('./CalendarEventCard.vue', () => ({
  default: { name: 'CalendarEventCard', template: '<div />' },
}))

vi.mock('@schedule-x/vue', () => ({
  ScheduleXCalendar: {
    name: 'ScheduleXCalendar',
    template: '<div data-test="calendar-ready" />',
  },
}))

vi.mock('@schedule-x/calendar', () => ({
  viewDay: { name: 'day' },
  createViewDay: vi.fn(() => ({})),
  createCalendar: vi.fn(() => ({ destroy: vi.fn() })),
}))

vi.mock('@schedule-x/ical', () => ({
  createIcalendarPlugin: vi.fn(() => {
    const plugin = {
      between: vi.fn(),
      icalEventToSXEvent: () => ({ id: 'schedule-x-id' }),
    }
    icalendarPluginMocks.push(plugin)
    return plugin
  }),
}))

vi.mock('@schedule-x/current-time', () => ({
  createCurrentTimePlugin: vi.fn(() => ({})),
}))

vi.mock('@schedule-x/calendar-controls', () => ({
  createCalendarControlsPlugin: vi.fn(() => ({ setDate: vi.fn() })),
}))

vi.mock('@schedule-x/events-service', () => ({
  createEventsServicePlugin: vi.fn(() => ({})),
}))

vi.mock('@schedule-x/scroll-controller', () => ({
  createScrollControllerPlugin: vi.fn(() => ({ scrollTo: vi.fn() })),
}))

import { HttpError } from '@/shared/api/http'
import { calendarApi } from '@/features/calendar-subscription'
import CalendarView from './CalendarView.vue'
import useGeoStore from '@/shared/model/geo'
import useSecretaryStore from '@/entities/secretary-auth'
import { createCalendar } from '@schedule-x/calendar'
import { createScrollControllerPlugin } from '@schedule-x/scroll-controller'

const passthroughStub = defineComponent({
  template: '<div><slot /></div>',
})
const buttonStub = defineComponent({
  props: {
    label: { type: String, default: '' },
    loading: Boolean,
    disable: Boolean,
  },
  emits: ['click'],
  template:
    '<button :disabled="disable" @click="$emit(\'click\')">{{ label }}</button>',
})

const wrappers: VueWrapper[] = []
const queryClients: QueryClient[] = []

function mountScheduleCalendar(): VueWrapper {
  const pinia = createPinia()
  setActivePinia(pinia)
  useGeoStore().timeZone = 'Europe/Moscow'
  const secretaryStore = useSecretaryStore()
  secretaryStore.login = 'user'
  secretaryStore.password = 'password'
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClients.push(queryClient)

  const wrapper = mount(CalendarView, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      stubs: {
        QPage: passthroughStub,
        QScrollArea: passthroughStub,
        QPullToRefresh: defineComponent({
          template: '<div><slot /></div>',
          methods: { updateScrollTarget() {} },
        }),
        QVirtualScroll: defineComponent({
          template: '<div />',
          methods: { scrollTo() {} },
        }),
        QSpinner: passthroughStub,
        QBtn: buttonStub,
        DayCalendar: true,
        CalendarEventCard: true,
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  queryClients.splice(0).forEach((queryClient) => queryClient.clear())
  icalendarPluginMocks.splice(0)
  vi.restoreAllMocks()
  window.history.replaceState(null, '', originalUrl)
  routeMock.hash = ''
  routeMock.query = {}
})

describe('ScheduleCalendarView loading states', () => {
  test('opens the fragment date and scrolls to its time in the calendar timezone', async () => {
    routeMock.hash = '#2026-10-04T22:30:00Z'
    window.history.replaceState(null, '', '/calendar' + routeMock.hash)
    vi.spyOn(calendarApi, 'getSubscription').mockResolvedValue(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n',
    )
    mountScheduleCalendar()
    await vi.waitFor(() => {
      expect(createScrollControllerPlugin).toHaveBeenCalledWith({
        initialScroll: '01:30',
      })
    })
    expect(
      vi.mocked(createCalendar).mock.calls.at(-1)![0].selectedDate!.toString(),
    ).toBe('2026-10-05')
  })

  test('renders the calendar for ICS containing VEVENT', async () => {
    vi.spyOn(calendarApi, 'getSubscription').mockResolvedValue(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:42',
        'DTSTART:20260102T090000Z',
        'DTEND:20260102T100000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    )

    const wrapper = mountScheduleCalendar()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="calendar-ready"]').exists()).toBe(true)
    })
  })

  test('renders a bounded busy availability', async () => {
    vi.spyOn(calendarApi, 'getSubscription').mockResolvedValue(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VFREEBUSY',
        'UID:busy-1',
        'FREEBUSY;FBTYPE=BUSY:20260726T180000Z/20260726T190000Z',
        'END:VFREEBUSY',
        'END:VCALENDAR',
      ].join('\r\n'),
    )

    const wrapper = mountScheduleCalendar()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="calendar-ready"]').exists()).toBe(true)
    })
  })

  test('keeps valid ICS without VEVENT visible without an empty-state message', async () => {
    vi.spyOn(calendarApi, 'getSubscription').mockResolvedValue(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Secretary//Tests//EN',
        'END:VCALENDAR',
      ].join('\r\n'),
    )

    const wrapper = mountScheduleCalendar()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="calendar-ready"]').exists()).toBe(true)
    })
    expect(wrapper.text()).not.toContain('pages.calendar.empty')
    expect(wrapper.find('[data-test="calendar-error"]').exists()).toBe(false)
  })

  test('shows an error screen for malformed ICS', async () => {
    vi.spyOn(calendarApi, 'getSubscription').mockResolvedValue(
      'BEGIN:VCALENDAR\r\nVERSION:2.0',
    )

    const wrapper = mountScheduleCalendar()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="calendar-error"]').exists()).toBe(true)
    })
  })

  test('shows an error screen and retries with refetch', async () => {
    const getSubscription = vi
      .spyOn(calendarApi, 'getSubscription')
      .mockRejectedValueOnce(new HttpError(503, '503 Service Unavailable'))
      .mockResolvedValueOnce(
        [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Secretary//Tests//EN',
          'END:VCALENDAR',
        ].join('\r\n'),
      )
    const wrapper = mountScheduleCalendar()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="calendar-error"]').exists()).toBe(true)
    })

    await wrapper.find('[data-test="calendar-retry"]').trigger('click')

    await vi.waitFor(() => {
      expect(getSubscription).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[data-test="calendar-ready"]').exists()).toBe(true)
    })
    expect(wrapper.text()).not.toContain('pages.calendar.empty')
    expect(wrapper.find('[data-test="calendar-error"]').exists()).toBe(false)
  })
})
