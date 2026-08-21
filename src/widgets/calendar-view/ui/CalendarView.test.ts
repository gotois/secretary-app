import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const host = vi.hoisted(() => ({
  isMcpApp: { __v_isRef: true, value: false },
}))

vi.mock('@/shared/lib/detector', () => ({
  isMcpApp: host.isMcpApp,
}))

vi.mock('./ScheduleCalendarView.vue', () => ({
  default: {
    template: '<div data-test="schedule-calendar" />',
  },
}))

vi.mock('./McpCalendarView.vue', () => ({
  default: {
    template: '<div data-test="mcp-app-calendar" />',
  },
}))

import CalendarView from './CalendarView.vue'

beforeEach(() => {
  host.isMcpApp.value = false
})

describe('CalendarView host presentation', () => {
  test('renders the standard calendar for regular clients', () => {
    const wrapper = mount(CalendarView)

    expect(wrapper.find('[data-test="schedule-calendar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="mcp-app-calendar"]').exists()).toBe(false)
  })

  test('renders the Mcp presentation inside the same widget', async () => {
    host.isMcpApp.value = true
    const wrapper = mount(CalendarView)
    await flushPromises()

    expect(wrapper.find('[data-test="mcp-app-calendar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="schedule-calendar"]').exists()).toBe(false)
  })
})
