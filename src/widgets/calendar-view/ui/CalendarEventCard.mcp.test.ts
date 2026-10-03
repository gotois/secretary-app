import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'

vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useQuasar: () => ({
      platform: { is: { desktop: true } },
      dark: { isActive: false },
    }),
  }
})

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

import CalendarEvent from './CalendarEventCard.vue'
import TaskDetails from './TaskDetails.vue'

const popupStub = defineComponent({
  name: 'QPopupProxy',
  setup(_, { slots, expose }) {
    const opened = ref(false)
    expose({
      show: () => {
        opened.value = true
      },
    })
    return () =>
      opened.value ? h('aside', { role: 'dialog' }, slots.default?.()) : null
  },
})
const stubs = {
  QCard: { template: '<article><slot /></article>' },
  QCardSection: { template: '<section><slot /></section>' },
  QPopupProxy: popupStub,
  QIcon: true,
  QSeparator: true,
  QTooltip: true,
}

describe('MCP read-only calendar event popup', () => {
  test('opens the shared TaskDetails popup by keyboard and formats dates in the host timezone', async () => {
    const wrapper = mount(CalendarEvent, {
      props: {
        readOnly: true,
        eventId: 'event-uid',
        title: 'DST meeting',
        description: '<script>secret()</script>',
        location: 'Office',
        start: Temporal.ZonedDateTime.from('2026-03-29T00:30:00Z[UTC]'),
        end: Temporal.ZonedDateTime.from('2026-03-29T01:30:00Z[UTC]'),
        timezone: 'Europe/Berlin',
        locale: 'en-GB',
      },
      global: { stubs },
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.get('[role="button"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.findComponent(TaskDetails).exists()).toBe(true)
    expect(wrapper.get('[role="dialog"]').text()).toContain(
      '29 Mar 2026, 01:30 — 29 Mar 2026, 03:30',
    )
    expect(wrapper.text()).toContain('<script>secret()</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
    wrapper.unmount()
  })

  test('opens date-only events with space without shifting the host day', async () => {
    const wrapper = mount(CalendarEvent, {
      props: {
        readOnly: true,
        eventId: 'event-uid',
        title: 'All day',
        start: Temporal.PlainDate.from('2026-10-01'),
        end: Temporal.PlainDate.from('2026-10-01'),
        timezone: 'Asia/Tokyo',
        locale: 'en-GB',
      },
      global: { stubs },
    })
    await wrapper.get('[role="button"]').trigger('keydown', { key: ' ' })
    const details = wrapper.getComponent(TaskDetails)
    expect(details.props('startTime').toISOString()).toBe(
      '2026-09-30T15:00:00.000Z',
    )
    expect(wrapper.get('[role="dialog"]').text()).toContain('1 Oct 2026, 00:00')
    wrapper.unmount()
  })
})
