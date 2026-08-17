import { shallowMount } from '@vue/test-utils'
import { Temporal } from '@js-temporal/polyfill'
import { describe, expect, test, vi } from 'vitest'

const eventStoreMock = vi.hoisted(() => ({
  getEvent: vi.fn(),
  deleteEvent: vi.fn(),
}))
const notify = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useQuasar: () => ({
      notify,
      dark: { isActive: false },
      platform: { is: { desktop: false } },
    }),
  }
})
vi.mock('@/features/event-editor', () => ({
  useEventStore: () => eventStoreMock,
}))
vi.mock('./TaskFull.vue', () => ({
  default: {
    emits: ['remove'],
    template: '<button @click="$emit(\'remove\')">Удалить</button>',
  },
}))

import CalendarEventCard from './CalendarEventCard.vue'

describe('CalendarEventCard', () => {
  test('resolves the calendar UID before deleting the event', async () => {
    const wrapper = shallowMount(CalendarEventCard, {
      props: {
        eventId: '4ab25c3d-00cf-4c0a-8c72-4b59f2dd2007',
        title: 'Встреча',
        start: Temporal.ZonedDateTime.from(
          '2026-08-14T09:00:00+03:00[Europe/Moscow]',
        ) as unknown as globalThis.Temporal.ZonedDateTime,
        end: Temporal.ZonedDateTime.from(
          '2026-08-14T10:00:00+03:00[Europe/Moscow]',
        ) as unknown as globalThis.Temporal.ZonedDateTime,
      },
      global: {
        stubs: {
          QCard: { template: '<section><slot /></section>' },
          QCardSection: { template: '<section><slot /></section>' },
          QPopupProxy: { template: '<section><slot /></section>' },
          TaskFull: {
            emits: ['remove'],
            template: '<button @click="$emit(\'remove\')">Удалить</button>',
          },
        },
      },
    })

    await wrapper.get('button').trigger('click')
    await notify.mock.calls[0]?.[0].actions[0].handler()

    expect(eventStoreMock.deleteEvent).toHaveBeenCalledWith({
      uid_tasks: ['4ab25c3d-00cf-4c0a-8c72-4b59f2dd2007'],
    })
  })
})
