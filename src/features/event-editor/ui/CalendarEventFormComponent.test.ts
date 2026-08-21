import { defineComponent, h } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const eventStoreMock = vi.hoisted(() => ({
  createEvent: vi.fn(),
  editEvent: vi.fn(),
}))

vi.mock('../model/store', () => ({
  default: () => eventStoreMock,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/shared/lib/detector', async () => {
  const { computed } = await import('vue')
  return {
    isMcpApp: computed(() => false),
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
  })

  test('creates a new event when the form is submitted', async () => {
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

    expect(wrapper.html()).toContain('label="Создать"')
    await wrapper.find('form').trigger('submit')

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
