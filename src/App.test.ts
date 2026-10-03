import { mount, flushPromises } from '@vue/test-utils'
import { shallowRef } from 'vue'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { calendarResult } from '@/shared/lib/mcp/fixtures'
import type { CalendarHostBridge } from '@/shared/lib/mcp/hostBridge'

const host = vi.hoisted(() => ({ create: vi.fn(), dark: vi.fn() }))
vi.mock('@/shared/lib/mcp/hostBridge', () => ({
  createHostBridge: host.create,
}))
vi.mock('@/shared/lib/detector', () => ({ isTWA: false }))
vi.mock('quasar', () => ({
  QLayout: { template: '<main><slot /></main>' },
  QPageContainer: { template: '<section><slot /></section>' },
  Dark: { set: host.dark },
  useMeta: vi.fn(),
}))
vi.mock('vue-router', () => ({
  RouterView: { template: '<div data-test="browser-router" />' },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: 'ru-RU' } }),
}))
vi.mock('@/widgets/calendar-view/presentation', () => ({
  ScheduleCalendarView: {
    name: 'ScheduleCalendarView',
    props: {
      calendar: String,
      timezone: String,
      locale: String,
      selectedDate: String,
      loading: Boolean,
      error: String,
      readOnly: Boolean,
    },
    emits: ['refresh', 'selectDate'],
    template: '<div data-test="embedded-calendar" />',
  },
}))
import App from './App.vue'

let bridge: CalendarHostBridge
beforeEach(() => {
  vi.stubEnv('MCP_APP', 'true')
  bridge = {
    content: shallowRef(calendarResult('2026-10-01').structuredContent),
    context: shallowRef({
      theme: 'dark',
      locale: 'en-GB',
      timeZone: 'Europe/Moscow',
    }),
    error: shallowRef(undefined),
    connected: shallowRef(true),
    connecting: shallowRef(false),
    connect: vi.fn().mockResolvedValue(undefined),
    loadDay: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  } as CalendarHostBridge
  host.create.mockReturnValue(bridge)
})
afterEach(() => vi.unstubAllEnvs())

test('browser mode renders its router without connecting to MCP or changing the theme', () => {
  vi.stubEnv('MCP_APP', 'false')
  const wrapper = mount(App)
  expect(wrapper.find('[data-test="browser-router"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="embedded-calendar"]').exists()).toBe(false)
  expect(host.create).not.toHaveBeenCalled()
  expect(host.dark).not.toHaveBeenCalled()
  wrapper.unmount()
})

test('embedded mode renders the shared read-only calendar with initial host data and closes on unmount', () => {
  const wrapper = mount(App)
  const calendar = wrapper.getComponent({ name: 'ScheduleCalendarView' })
  expect(wrapper.find('[data-test="browser-router"]').exists()).toBe(false)
  expect(calendar.props()).toMatchObject({
    calendar: bridge.content.value?.calendar,
    selectedDate: '2026-10-01',
    timezone: 'Europe/Moscow',
    locale: 'en-GB',
    readOnly: true,
  })
  expect(bridge.connect).toHaveBeenCalledOnce()
  expect(bridge.loadDay).not.toHaveBeenCalled()
  expect(host.dark).toHaveBeenCalledWith(true)
  wrapper.unmount()
  expect(bridge.close).toHaveBeenCalledOnce()
})

test('date selection and refresh invoke the MCP read tool and surface errors', async () => {
  const wrapper = mount(App)
  const calendar = wrapper.getComponent({ name: 'ScheduleCalendarView' })
  calendar.vm.$emit('selectDate', '2026-10-02')
  await flushPromises()
  expect(bridge.loadDay).toHaveBeenCalledWith('2026-10-02', 'Europe/Moscow')
  vi.mocked(bridge.loadDay).mockRejectedValueOnce(new Error('Unavailable'))
  calendar.vm.$emit('refresh')
  await flushPromises()
  expect(calendar.props('error')).toBe('Unavailable')
  calendar.vm.$emit('refresh')
  await flushPromises()
  expect(calendar.props('error')).toBeUndefined()
  wrapper.unmount()
})

test('startup blocks duplicate reads and a disconnected retry reconnects', async () => {
  bridge.connecting.value = true
  const wrapper = mount(App)
  const calendar = wrapper.getComponent({ name: 'ScheduleCalendarView' })
  calendar.vm.$emit('refresh')
  expect(bridge.loadDay).not.toHaveBeenCalled()
  bridge.connecting.value = false
  bridge.connected.value = false
  calendar.vm.$emit('refresh')
  await flushPromises()
  expect(bridge.connect).toHaveBeenCalledTimes(2)
  expect(bridge.loadDay).not.toHaveBeenCalled()
  wrapper.unmount()
})
