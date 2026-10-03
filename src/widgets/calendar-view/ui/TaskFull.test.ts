import { shallowMount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useQuasar: () => ({ platform: { is: { desktop: true } } }),
  }
})
vi.mock('pinia', async () => {
  const { ref } = await import('vue')
  return { storeToRefs: () => ({ isLoggedIn: ref(false) }) }
})
vi.mock('@/entities/oidc-session', () => ({ default: () => ({}) }))
vi.mock('@/features/pod-sync', () => ({ usePodStore: () => ({}) }))
vi.mock('@/entities/contract', () => ({
  default: () => ({}),
  ContractCarouselComponent: { template: '<div />' },
}))
vi.mock('@/shared/model/lang', () => ({
  default: () => ({ language: 'ru-RU' }),
}))
vi.mock('@/shared/lib/geoService', () => ({ openMap: vi.fn() }))
vi.mock('@/shared/lib/databaseService', () => ({ keyPair: {} }))
vi.mock('@/shared/lib/markdownHelper', () => ({
  parse: (value: string) => value,
}))
vi.mock('@/shared/lib/dateHelper', () => ({ isDateNotOk: () => false }))
vi.mock('@/shared/lib/fileHelper', () => ({}))
vi.mock('@/features/contract-calendar', () => ({}))
vi.mock('@/shared/lib/mailHelper', () => ({ mailUrl: vi.fn() }))
vi.mock('@/shared/lib/urlHelper', () => ({ open: vi.fn() }))
vi.mock('@/shared/lib/customLoaders', () => ({ documentLoader: vi.fn() }))

import TaskFull from './TaskFull.vue'

describe('TaskFull', () => {
  test('emits remove after clicking the delete button', async () => {
    const wrapper = shallowMount(TaskFull, {
      props: {
        eventId: '42',
        title: 'Встреча',
        startTime: new Date('2026-08-14T09:00:00.000Z'),
      },
      global: {
        stubs: {
          TaskDetails: {
            template:
              '<section><slot name="actions" /><slot name="tags" /></section>',
          },
          QBtn: {
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          QTooltip: { template: '<span><slot /></span>' },
          QIcon: true,
          QSeparator: true,
          QCardSection: { template: '<section><slot /></section>' },
          QCard: { template: '<section><slot /></section>' },
        },
      },
    })

    await wrapper.get('button[aria-label="Удалить событие"]').trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})
