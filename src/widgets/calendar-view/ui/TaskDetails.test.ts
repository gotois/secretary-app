import { shallowMount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'

vi.mock('quasar', async (importOriginal) => {
  const original = await importOriginal<typeof import('quasar')>()
  return {
    ...original,
    useQuasar: () => ({ platform: { is: { desktop: true } } }),
  }
})

import TaskDetails from './TaskDetails.vue'

const stubs = {
  QCard: { template: '<article><slot /></article>' },
  QCardSection: { template: '<section><slot /></section>' },
  QSeparator: true,
  QIcon: true,
  QTooltip: true,
}

describe('TaskDetails', () => {
  test('renders read-only event details without PWA stores or a router', () => {
    const wrapper = shallowMount(TaskDetails, {
      props: {
        title: 'Встреча',
        description: '**Обсуждение**',
        startTime: new Date('2026-10-01T22:30:00Z'),
        location: 'Офис',
        locale: 'ru-RU',
        timezone: 'Europe/Moscow',
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Встреча')
    expect(wrapper.get('strong').text()).toBe('Обсуждение')
    expect(wrapper.text()).toContain('2 окт. 2026')
    expect(wrapper.text()).toContain('Офис')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  test('formats instants in the host timezone across the DST transition', () => {
    const wrapper = shallowMount(TaskDetails, {
      props: {
        title: 'DST',
        startTime: new Date('2026-03-29T00:30:00Z'),
        endTime: new Date('2026-03-29T01:30:00Z'),
        locale: 'en-GB',
        timezone: 'Europe/Berlin',
        showTime: true,
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('29 Mar 2026, 01:30 — 29 Mar 2026, 03:30')
  })

  test('preserves date-only presentation and optional PWA action slots', () => {
    const wrapper = shallowMount(TaskDetails, {
      props: {
        title: 'Событие',
        startTime: new Date('2026-10-01T09:00:00Z'),
        endTime: null,
        locale: 'en-GB',
        timezone: 'UTC',
      },
      slots: {
        actions: '<button>Поделиться</button>',
        attachments: '<img alt="Вложение" />',
        tags: '<span>Работа</span>',
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('1 Oct 2026')
    expect(wrapper.text()).not.toContain('09:00')
    expect(wrapper.get('button').text()).toBe('Поделиться')
    expect(wrapper.find('img[alt="Вложение"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Работа')
  })
})
