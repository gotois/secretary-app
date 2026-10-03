import { defineComponent, h } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const replace = vi.hoisted(() => vi.fn())

const eventStoreMock = vi.hoisted(() => ({
  createEvent: vi.fn(),
  editEvent: vi.fn(),
  getTelegramGroups: vi.fn(),
}))

vi.mock('../model/store', () => ({
  default: () => eventStoreMock,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/shared/lib/detector', async () => {
  const { computed } = await import('vue')
  return {
    isTMA: computed(() => false),
  }
})

vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useQuasar: () => ({
      platform: { is: { desktop: true } },
      notify: vi.fn(),
      dialog: vi.fn(),
    }),
  }
})

import CalendarEventFormComponent from './CalendarEventFormComponent.vue'

const formStub = defineComponent({
  name: 'QForm',
  emits: ['submit'],
  setup(_, { emit, expose, slots }) {
    expose({ validate: async () => true })
    return () =>
      h(
        'form',
        {
          onSubmit: (event: Event) => {
            event.preventDefault()
            emit('submit')
          },
        },
        slots.default?.(),
      )
  },
})

const selectStub = {
  props: ['label', 'options', 'modelValue'],
  template:
    '<div :data-label="label" :data-first-option-label="options[0] && options[0].label" :data-first-option-value="String(options[0] && options[0].value)" />',
}

describe('CalendarEventFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    eventStoreMock.getTelegramGroups.mockResolvedValue([])
  })

  test.each([
    [
      '53454352-4554-8000-8000-00000000002a',
      { uid_task: '53454352-4554-8000-8000-00000000002a' },
    ],
    [42, { id_task: 42 }],
    ['42', { id_task: 42 }],
  ])(
    'saves an existing event with identifier %s',
    async (taskId, identifier) => {
      const wrapper = shallowMount(CalendarEventFormComponent, {
        props: {
          task: {
            id_task: 42,
            name: 'Встреча',
            start_date: '2026-10-04T10:00:00.000Z',
          },
          readonly: false,
          taskId,
        },
        global: { stubs: { QForm: formStub } },
      })

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(eventStoreMock.editEvent).toHaveBeenCalledOnce()
      const payload = eventStoreMock.editEvent.mock.calls[0]![0]
      expect(payload).toEqual(expect.objectContaining(identifier))
      expect(payload).not.toHaveProperty(
        'uid_task' in identifier ? 'id_task' : 'uid_task',
      )
      expect(wrapper.emitted('saved')).toHaveLength(1)
      expect(wrapper.emitted('saved')![0]).toEqual([])
      expect(replace).toHaveBeenCalledWith({
        name: 'calendar',
        hash:
          '#' +
          Temporal.Instant.from(payload.start_date.toISOString()).toString(),
      })
    },
  )

  test('creates a new event when the form is submitted', async () => {
    const wrapper = shallowMount(CalendarEventFormComponent, {
      props: {
        task: {
          id_task: 0,
          targetType: 'Person',
          name: 'Новое событие',
          id_category: 2,
          id_cal_class: 3,
          estimated_unix_time: 3600,
          start_date: '2026-07-22T10:00:00.000Z',
          end_date: '2026-07-22T11:00:00.000Z',
        },
        readonly: false,
        taskId: null,
      },
      global: {
        stubs: {
          QForm: formStub,
          QCardActions: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.html()).toContain('label="Создать"')
    const targetSelect = wrapper
      .findAllComponents({ name: 'QSelect' })
      .find((select) => select.props('label') === 'Кому')
    expect(targetSelect?.exists()).toBe(true)
    await wrapper.find('form').trigger('submit')

    expect(eventStoreMock.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id_category: 2,
        id_cal_class: 3,
        estimated_unix_time: 3600,
        target: [null],
      }),
    )
    expect(eventStoreMock.createEvent).toHaveBeenCalledOnce()
  })

  test('ignores a repeated submit while creation is in progress', async () => {
    let finishCreate!: () => void
    eventStoreMock.createEvent.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishCreate = resolve
        }),
    )
    const wrapper = shallowMount(CalendarEventFormComponent, {
      props: {
        task: {
          id_task: 0,
          targetType: 'Person',
          name: 'Новое событие',
          start_date: '2026-07-22T10:00:00.000Z',
          end_date: '2026-07-22T11:00:00.000Z',
        },
        readonly: false,
        taskId: null,
      },
      global: {
        stubs: {
          QForm: formStub,
          QCardActions: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    await Promise.all([
      wrapper.find('form').trigger('submit'),
      wrapper.find('form').trigger('submit'),
    ])

    expect(eventStoreMock.createEvent).toHaveBeenCalledOnce()
    finishCreate()
  })

  test('lets a PWA user select a group alongside their own actor', async () => {
    eventStoreMock.getTelegramGroups.mockResolvedValue([
      { id: -100, title: 'Team' },
    ])
    const wrapper = shallowMount(CalendarEventFormComponent, {
      props: {
        task: {
          id_task: 0,
          name: 'Meeting',
          start_date: '2026-10-04T10:00:00Z',
        },
        readonly: false,
        taskId: null,
      },
      global: { stubs: { QForm: formStub } },
    })
    const select = wrapper
      .findAllComponents({ name: 'QSelect' })
      .find((item) => item.props('label') === 'Кому')!
    select.vm.$emit('filter', 'team', (update: () => void) => update())
    await flushPromises()
    expect(eventStoreMock.getTelegramGroups).toHaveBeenCalledWith('team')
    select.vm.$emit('update:modelValue', [
      ...select.props('modelValue'),
      select.props('options')[0],
    ])
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(eventStoreMock.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [null, { type: 'Group', id: -100, name: 'Team' }],
      }),
    )
  })

  test('shows the saved reminder date instead of a raw zero value', () => {
    const originalTimeZone = process.env.TZ
    process.env.TZ = 'Europe/Moscow'
    try {
      const wrapper = shallowMount(CalendarEventFormComponent, {
        props: {
          task: {
            id_task: 5002,
            targetType: 'Person',
            name: 'Позвонить врачу',
            start_date: '2026-07-27T06:00:00.000Z',
            notification_date_time: '2026-07-27T06:00:00.000Z',
            remind_before: 0,
          },
          readonly: false,
          taskId: 5002,
        },
        global: {
          stubs: {
            QForm: formStub,
            QSelect: selectStub,
          },
        },
      })

      const reminderSelect = wrapper.get('[data-label="Напоминание"]')

      expect(reminderSelect.attributes('data-first-option-label')).toMatch(
        /27\.07\.2026.*09:00/,
      )
      expect(reminderSelect.attributes('data-first-option-value')).toBe('0')
    } finally {
      if (originalTimeZone) {
        process.env.TZ = originalTimeZone
      } else {
        delete process.env.TZ
      }
    }
  })
})
