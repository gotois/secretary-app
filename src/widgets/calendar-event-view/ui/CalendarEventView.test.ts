import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'

const { push, getEvent, quasar } = vi.hoisted(() => ({
  push: vi.fn(),
  getEvent: vi.fn(),
  quasar: {
    dark: { isActive: false },
    platform: { is: { desktop: true } },
    loading: { show: vi.fn(), hide: vi.fn() },
    notify: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ name: 'edit' }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('quasar')>()),
  useQuasar: () => quasar,
  useMeta: vi.fn(),
  QSkeleton: { template: '<span />' },
}))
vi.mock('@/shared/lib/detector', () => ({ isTMA: { value: false } }))
vi.mock('@/features/event-editor', () => ({
  __esModule: true,
  useEventStore: () => ({ getEvent }),
  default: {
    name: 'CalendarEventFormComponent',
    props: ['task', 'taskId', 'readonly'],
    emits: ['saved', 'removed'],
    template: '<button @click="$emit(\'saved\')">Сохранить</button>',
  },
}))

import CalendarEventView from './CalendarEventView.vue'

describe('CalendarEventView', () => {
  test('preserves the calendar UID and confirms saving', async () => {
    const taskUid = '53454352-4554-8000-8000-00000000002a'
    getEvent.mockResolvedValue({ id_task: 42, name: 'Встреча' })
    const slotStub = { template: '<section><slot /></section>' }
    const wrapper = mount(CalendarEventView, {
      props: { taskId: taskUid },
      global: {
        mocks: { $q: quasar },
        stubs: {
          QPage: slotStub,
          QScrollArea: slotStub,
          QPullToRefresh: slotStub,
          QCard: slotStub,
          QSpace: true,
          QSkeleton: true,
        },
      },
    })
    await flushPromises()

    expect(getEvent).toHaveBeenCalledWith(taskUid)
    expect(
      wrapper
        .getComponent({ name: 'CalendarEventFormComponent' })
        .props('taskId'),
    ).toBe(taskUid)
    expect(push).not.toHaveBeenCalled()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(quasar.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Сохранено',
    })
  })
})
