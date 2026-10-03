import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  destroy: vi.fn(),
  setDate: vi.fn(),
}))
vi.mock('../lib/calendar', () => ({ createCalendarView: mocks.create }))
vi.mock('@schedule-x/calendar-controls', () => ({
  createCalendarControlsPlugin: () => ({ setDate: mocks.setDate }),
}))
vi.mock('@schedule-x/vue', () => ({
  ScheduleXCalendar: { template: '<div data-test="calendar" />' },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('./CalendarEventCard.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./DayCalendar.vue', () => ({ default: { template: '<div />' } }))
const dark = reactive({ isActive: false })
vi.mock('quasar', async (original) => ({
  ...(await original<typeof import('quasar')>()),
  useQuasar: () => ({
    dark,
    platform: { is: { desktop: false } },
    notify: vi.fn(),
  }),
}))
import ScheduleCalendarView from './ScheduleCalendarView.vue'
const wrappers: ReturnType<typeof mount>[] = []
function render(props = {}) {
  mocks.create.mockReturnValue({ destroy: mocks.destroy })
  const wrapper = mount(ScheduleCalendarView, {
    props: {
      timezone: 'Europe/Moscow',
      locale: 'ru-RU',
      selectedDate: '2026-10-01',
      calendar: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n',
      ...props,
    },
    global: {
      stubs: {
        QPage: { template: '<main><slot /></main>' },
        QScrollArea: { template: '<div><slot /></div>' },
        QPullToRefresh: {
          template: '<div><slot /></div>',
          methods: { updateScrollTarget() {} },
        },
        QVirtualScroll: { template: '<div />', methods: { scrollTo() {} } },
        QBtn: {
          props: ['disable', 'loading', 'label'],
          emits: ['click'],
          template:
            '<button :disabled="disable || loading" @click="$emit(\'click\')">{{ label }}</button>',
        },
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  vi.clearAllMocks()
  dark.isActive = false
})
describe('shared calendar presentation', () => {
  test('emits week selection and refreshes through pull-to-refresh', async () => {
    const wrapper = render({ readOnly: true })
    await wrapper.get('[aria-label="Следующая неделя"]').trigger('click')
    expect(wrapper.emitted('selectDate')).toEqual([['2026-10-08']])
    expect(wrapper.find('[aria-label="Обновить"]').exists()).toBe(false)
    const done = vi.fn()
    wrapper.findComponent({ ref: 'pullToRefreshRef' }).vm.$emit('refresh', done)
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    expect(done).toHaveBeenCalledOnce()
  })
  test('keeps an empty calendar visible and rebuilds when host theme or locale changes', async () => {
    const wrapper = render()
    expect(wrapper.find('[data-test="calendar"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('pages.calendar.empty')
    dark.isActive = true
    await flushPromises()
    expect(mocks.create.mock.calls.at(-1)![2]).toBe(true)
    await wrapper.setProps({ locale: 'en-US' })
    expect(mocks.create.mock.calls.at(-1)![1]).toBe('en-US')
  })
  test('shows a retry action for an initial error and disables navigation while loading', async () => {
    const wrapper = render({
      calendar: undefined,
      error: 'Failed',
      readOnly: true,
    })
    expect(wrapper.text()).toContain('Failed')
    await wrapper.get('[data-test="calendar-retry"]').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ loading: true })
    expect(
      wrapper.get('[aria-label="Следующая неделя"]').attributes('disabled'),
    ).toBeDefined()
  })
})
